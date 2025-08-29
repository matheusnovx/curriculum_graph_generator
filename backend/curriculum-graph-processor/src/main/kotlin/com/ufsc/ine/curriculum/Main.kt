// Em: src/main/kotlin/com/ufsc/ine/curriculum/Main.kt

package com.ufsc.ine.curriculum

import com.ufsc.ine.curriculum.config.Neo4jDriverFactory
import com.ufsc.ine.curriculum.parser.GraphParser
import com.ufsc.ine.curriculum.persistence.CurriculumRepository
import java.io.File

fun main() {
    println("🚀 Iniciando o processador de currículos...")

    // Inicializa as dependências
    val parser = GraphParser()
    val driver = Neo4jDriverFactory.driver
    val repository = CurriculumRepository(driver)

    // Caminho para a pasta de recursos onde os JSONs estão
    val resourcesPath = "/Users/novais/curriculum_graph_generator/backend/curriculum-graph-processor/src/main/resources"
    val resourcesDir = File(resourcesPath)

    if (!resourcesDir.exists()) {
        println("❌ Erro: Diretório de recursos não encontrado em '$resourcesPath'")
        return
    }

    // Varre todos os arquivos e subdiretórios em busca de arquivos .json
    resourcesDir.walkTopDown()
        .filter { it.isFile && it.extension == "json" }
        .forEach { jsonFile ->
            try {
                println("📄 Processando arquivo: ${jsonFile.path}")
                val jsonString = jsonFile.readText()

                // O parser retorna uma lista de grafos (um para cada currículo no arquivo)
                val graphs = parser.parse(jsonString)

                graphs.forEach { graph ->
                    println("  -> Salvando grafo para o currículo '${graph.curriculumId}' no Neo4j...")
                    repository.saveGraph(graph)
                }
                println("✅ Arquivo ${jsonFile.name} processado com sucesso.")

            } catch (e: Exception) {
                println("❌ Erro ao processar o arquivo ${jsonFile.name}: ${e.message}")
                // Opcional: descomente para ver o stack trace completo do erro
                 e.printStackTrace()
            }
        }

    // Fecha a conexão com o banco de dados ao final de tudo
    driver.close()
    println("🏁 Processamento finalizado.")
}