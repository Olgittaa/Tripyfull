package com.tripyfull.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Set;
import java.util.UUID;

/**
 * Turns an uploaded image into a stored place photo.
 *
 * Uploads are normalised rather than kept as they arrive: a phone photo is
 * 4-12 MB and 4000 px wide, which is pointless for a 460 px panel and a 16:9
 * card. Every upload is scaled down to {@link #MAX_EDGE} and re-encoded as
 * JPEG at {@link #QUALITY}, so one photo costs a couple of hundred KB instead
 * of several megabytes — and the disk can't be filled by a handful of places.
 */
@Service
public class PlacePhotoService {

    /** Longest edge kept — enough for a full-screen viewer on a retina laptop. */
    private static final int MAX_EDGE = 1600;
    private static final float QUALITY = 0.82f;
    /** Rejected before decoding: no point spending memory on a 40 MP original. */
    private static final long MAX_UPLOAD_BYTES = 10L * 1024 * 1024;
    /** What ImageIO decodes without extra plugins (no WebP, no HEIC). */
    private static final Set<String> ALLOWED_TYPES =
            Set.of("image/jpeg", "image/jpg", "image/png", "image/gif", "image/bmp");

    /** Photos per place — keeps one place from becoming an album. */
    public static final int MAX_PER_PLACE = 12;

    /** Public URL prefix; the serving endpoint lives at the same path. */
    public static final String URL_PREFIX = "/api/place-photos/";
    private static final String KEY_PREFIX = "places/";

    private final FileStorageService storage;

    public PlacePhotoService(FileStorageService storage) {
        this.storage = storage;
    }

    /** Validates, downscales and stores the upload; returns the photo's URL. */
    public String store(MultipartFile file, UUID placeId) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No image in the request");
        }
        if (file.getSize() > MAX_UPLOAD_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                    "Image is larger than " + (MAX_UPLOAD_BYTES / 1024 / 1024) + " MB");
        }
        String type = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        if (!ALLOWED_TYPES.contains(type)) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                    "Unsupported image type: use JPEG or PNG");
        }

        BufferedImage source;
        try (InputStream in = file.getInputStream()) {
            source = ImageIO.read(in);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read the image", e);
        }
        if (source == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read the image");
        }

        byte[] jpeg = encodeJpeg(downscale(source));
        String name = UUID.randomUUID() + ".jpg";
        storage.storeBytes(jpeg, KEY_PREFIX + placeId + "/" + name);
        return URL_PREFIX + placeId + "/" + name;
    }

    /** True for photos this app stores itself (as opposed to an external URL). */
    public boolean isStoredHere(String url) {
        return url != null && url.startsWith(URL_PREFIX);
    }

    /** Storage key behind a photo URL, or null when the URL isn't ours. */
    public String keyForUrl(String url) {
        if (!isStoredHere(url)) return null;
        return KEY_PREFIX + url.substring(URL_PREFIX.length());
    }

    public void deleteFile(String url) {
        String key = keyForUrl(url);
        if (key != null) storage.delete(key);
    }

    /**
     * Scales the image so its longest edge is at most {@link #MAX_EDGE}, halving
     * repeatedly first: a single big bicubic step from 4000 px aliases badly.
     */
    private BufferedImage downscale(BufferedImage source) {
        int targetW = source.getWidth();
        int targetH = source.getHeight();
        double scale = (double) MAX_EDGE / Math.max(targetW, targetH);
        if (scale < 1.0) {
            targetW = Math.max(1, (int) Math.round(targetW * scale));
            targetH = Math.max(1, (int) Math.round(targetH * scale));
        }

        BufferedImage current = source;
        while (current.getWidth() / 2 >= targetW && current.getHeight() / 2 >= targetH) {
            current = redraw(current, current.getWidth() / 2, current.getHeight() / 2);
        }
        return current.getWidth() == targetW && current.getHeight() == targetH
                ? current
                : redraw(current, targetW, targetH);
    }

    private BufferedImage redraw(BufferedImage source, int width, int height) {
        // JPEG has no alpha channel: paint white first so transparent PNGs
        // don't come out with black edges.
        BufferedImage out = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = out.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, width, height);
            g.drawImage(source, 0, 0, width, height, null);
        } finally {
            g.dispose();
        }
        return out;
    }

    private byte[] encodeJpeg(BufferedImage image) {
        ImageWriter writer = ImageIO.getImageWritersByFormatName("jpeg").next();
        ImageWriteParam params = writer.getDefaultWriteParam();
        params.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        params.setCompressionQuality(QUALITY);

        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        try (ImageOutputStream out = ImageIO.createImageOutputStream(bytes)) {
            writer.setOutput(out);
            writer.write(null, new IIOImage(image, null, null), params);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to encode the image", e);
        } finally {
            writer.dispose();
        }
        return bytes.toByteArray();
    }
}
