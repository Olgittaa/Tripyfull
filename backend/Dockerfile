# The API as one image, for Render (or any host that runs a container).
#
# Two stages: Maven builds the jar with the JDK, the jar runs on a bare JRE.
# Tests are not run here — they need a database and run before a commit lands
# on main; the image is built from main.
FROM eclipse-temurin:25-jdk AS build
WORKDIR /src
# Dependencies first, so a change in our own code does not re-download them.
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw -q -B dependency:go-offline
COPY src src
RUN ./mvnw -q -B -DskipTests package

FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=build /src/target/*.jar app.jar
# Uploads (photos, tickets) live here; on Render a disk is mounted at /var/data
# so they survive a deploy. Without one they last until the next restart.
RUN mkdir -p /var/data/uploads
ENV SPRING_PROFILES_ACTIVE=prod \
    UPLOAD_DIR=/var/data/uploads \
    JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=70"
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
