package com.tripyfull.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.checksums.RequestChecksumCalculation;
import software.amazon.awssdk.core.checksums.ResponseChecksumValidation;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.net.URI;
import java.util.Optional;

/**
 * Files in an S3-compatible bucket — Cloudflare R2 in production, where the
 * free instance has no disk and would lose every upload at each deploy. Keys
 * are the same strings the folder on a laptop uses, so nothing else changes.
 *
 * Configured by the S3_* variables (see application.properties). The bucket is
 * checked once at start-up: a wrong key or bucket name fails the deploy with a
 * sentence, rather than every upload failing later with a stack trace.
 */
@Service
@ConditionalOnProperty(name = "app.storage", havingValue = "s3")
public class S3FileStorage implements FileStorage {

    private static final Logger log = LoggerFactory.getLogger(S3FileStorage.class);

    private final S3Client s3;
    private final String bucket;

    public S3FileStorage(@Value("${app.storage.s3.endpoint}") String endpoint,
                         @Value("${app.storage.s3.bucket}") String bucket,
                         @Value("${app.storage.s3.access-key}") String accessKey,
                         @Value("${app.storage.s3.secret-key}") String secretKey,
                         @Value("${app.storage.s3.region:auto}") String region) {
        if (endpoint.isBlank() || bucket.isBlank() || accessKey.isBlank() || secretKey.isBlank()) {
            throw new IllegalStateException(
                    "app.storage=s3 needs S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY and S3_SECRET_KEY");
        }
        this.bucket = bucket;
        this.s3 = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey)))
                // The JDK's own HTTP client: a few small files a day need no Netty.
                .httpClientBuilder(UrlConnectionHttpClient.builder())
                // Bucket in the path, not the host name: what R2 and MinIO both serve.
                .forcePathStyle(true)
                // The SDK's newer trailing checksums are not something every
                // S3-compatible store understands; the classic Content-MD5 path is.
                .requestChecksumCalculation(RequestChecksumCalculation.WHEN_REQUIRED)
                .responseChecksumValidation(ResponseChecksumValidation.WHEN_REQUIRED)
                .build();
        try {
            s3.headBucket(HeadBucketRequest.builder().bucket(bucket).build());
        } catch (S3Exception e) {
            throw new IllegalStateException("Cannot reach bucket \"" + bucket + "\" at " + endpoint
                    + " (" + e.statusCode() + "): check S3_BUCKET, S3_ACCESS_KEY and S3_SECRET_KEY", e);
        }
        log.info("Uploads go to bucket \"{}\" at {}", bucket, endpoint);
    }

    @Override
    public String storeBytes(byte[] bytes, String key, String contentType) {
        try {
            s3.putObject(PutObjectRequest.builder()
                            .bucket(bucket)
                            .key(key)
                            .contentType(contentType != null && !contentType.isBlank()
                                    ? contentType : "application/octet-stream")
                            .build(),
                    RequestBody.fromBytes(bytes));
            return key;
        } catch (S3Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store file", e);
        }
    }

    @Override
    public Optional<StoredFile> open(String key) {
        try {
            ResponseInputStream<GetObjectResponse> in =
                    s3.getObject(GetObjectRequest.builder().bucket(bucket).key(key).build());
            Long length = in.response().contentLength();
            return Optional.of(new StoredFile(in, length != null ? length : -1));
        } catch (NoSuchKeyException e) {
            return Optional.empty();
        } catch (S3Exception e) {
            log.warn("Could not read {} from bucket {}: {}", key, bucket, e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public void delete(String key) {
        try {
            s3.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
        } catch (S3Exception e) {
            // best-effort: leave an orphan rather than fail the request
            log.warn("Could not delete {} from bucket {}: {}", key, bucket, e.getMessage());
        }
    }
}
