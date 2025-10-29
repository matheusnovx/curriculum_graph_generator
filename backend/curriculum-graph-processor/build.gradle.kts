plugins {
    kotlin("jvm") version "2.2.0"
    id("application")
}

group = "com.ufsc.ine.curriculum"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

dependencies {
    testImplementation(kotlin("test"))
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.3")
    implementation("org.neo4j.driver:neo4j-java-driver:5.13.0")
}

tasks.test {
    useJUnitPlatform()
}

application {
    mainClass.set("com.ufsc.ine.curriculum.MainKt")
}

kotlin {
    jvmToolchain(17)
}
