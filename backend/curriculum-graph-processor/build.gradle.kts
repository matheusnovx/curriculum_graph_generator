plugins {
    kotlin("jvm") version "2.2.0"
    id("application") // <-- ADICIONADO: Informa ao Gradle que este é um app executável
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

// <-- ADICIONADO: Define qual classe o 'run' deve executar
application {
    // Assumindo que seu arquivo principal é o 'Main.kt'
    mainClass.set("com.ufsc.ine.curriculum.MainKt")
}

kotlin {
    jvmToolchain(17)
}
