package com.ufsc.ine.curriculum

import com.ufsc.ine.curriculum.config.Neo4jDriverFactory
import com.ufsc.ine.curriculum.parser.GraphParser
import com.ufsc.ine.curriculum.persistence.CurriculumRepository
import java.io.File

fun main() {
    println("Iniciando o processador de currículos...")

    val parser = GraphParser()
    val driver = Neo4jDriverFactory.driver
    val repository = CurriculumRepository(driver)

    val resourcesPath = "backend/curriculum-graph-processor/src/main/resources"
    val debugFilePath: String? = null // Ex: "/caminho/para/seu/arquivo.json"
    val resourcesDirOrFile = debugFilePath?.let { File(it) } ?: File(resourcesPath)

    if (!resourcesDirOrFile.exists()) {
        println("Erro: Diretório de recursos não encontrado em '$resourcesPath'")
        return
    }

    val unprocessedFiles = mutableListOf<File>()

    val jsonFiles = if (resourcesDirOrFile.isFile && resourcesDirOrFile.extension == "json") {
        listOf(resourcesDirOrFile)
    } else {
        resourcesDirOrFile.walkTopDown()
            .filter { it.isFile && it.extension == "json" }
            .toList()
    }

    jsonFiles.forEach { jsonFile ->
        try {
            println("📄 Processando arquivo: ${jsonFile.path}")
            val jsonString = jsonFile.readText()
            val graphs = parser.parse(jsonString)
            graphs.forEach { graph ->
                println("  -> Salvando grafo para o currículo '${graph.curriculumId}' no Neo4j...")
                repository.saveGraph(graph)
            }
            println("Arquivo ${jsonFile.name} processado com sucesso.")
        } catch (e: Exception) {
            println("Erro ao processar o arquivo ${jsonFile.name}: ${e.message}")
            unprocessedFiles.add(jsonFile)
            e.printStackTrace()
        }
    }

    if (unprocessedFiles.isNotEmpty()) {
        println("Arquivos não processados:")
        unprocessedFiles.forEach { println(" - ${it.name}") }
    }

    // Fecha a conexão com o banco de dados ao final de tudo
    driver.close()
    println("Processamento finalizado.")
}