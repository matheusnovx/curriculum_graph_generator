// Localização: src/main/kotlin/com/ufsc/ine/curriculum/parser/GraphParser.kt

package com.ufsc.ine.curriculum.parser

import com.ufsc.ine.curriculum.model.CurriculumGraph
import com.ufsc.ine.curriculum.parser.handlers.BachelorDegreeCurriculumHandler
import com.ufsc.ine.curriculum.parser.handlers.CurriculumParserHandler
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject

/**
 * A classe principal responsável por orquestrar o parsing de uma string JSON
 * para uma lista de objetos CurriculumGraph.
 *
 * Ela utiliza o padrão de projeto "Chain of Responsibility" (Cadeia de Responsabilidade)
 * para determinar qual "handler" é capaz de processar o JSON fornecido.
 */
class GraphParser {

    /**
     * A cabeça da cadeia de responsabilidade. O primeiro handler a ser testado.
     */
    private val chain: CurriculumParserHandler

    /**
     * O bloco de inicialização constrói a cadeia de handlers.
     * Atualmente, temos apenas um handler, mas a estrutura está pronta para mais.
     */
    init {
        // Passo 1: Instanciar todos os handlers que você possui.
        val bachelorHandler = BachelorDegreeCurriculumHandler()
        // Exemplo futuro: val mastersHandler = MastersDegreeCurriculumHandler()

        // Passo 2: Definir a cabeça da cadeia.
        this.chain = bachelorHandler

        // Passo 3: Encadear os próximos handlers (se existirem).
        // bachelorHandler.next = mastersHandler
    }

    /**
     * Recebe uma string JSON, encontra o handler apropriado na cadeia e
     * a converte em uma lista de CurriculumGraph.
     *
     * @param jsonString O conteúdo bruto do arquivo JSON.
     * @return Uma lista de CurriculumGraph, pois um arquivo pode conter múltiplos currículos.
     * @throws IllegalArgumentException se nenhum handler na cadeia for capaz de processar o JSON.
     */
    fun parse(jsonString: String): List<CurriculumGraph> {
        // Converte a string de entrada em um objeto JSON manipulável
        val root = Json.parseToJsonElement(jsonString).jsonObject

        // Inicia a iteração a partir da cabeça da cadeia
        var currentHandler: CurriculumParserHandler? = chain

        while (currentHandler != null) {
            // Pergunta ao handler atual: "Você consegue processar este JSON?"
            if (currentHandler.canParse(root)) {
                // Se sim, delega o trabalho para ele e retorna o resultado.
                println("INFO: Handler '${currentHandler::class.simpleName}' selecionado para o parsing.")
                return currentHandler.parse(root)
            }
            // Se não, passa para o próximo handler na cadeia.
            currentHandler = currentHandler.next
        }

        // Se o loop terminar, nenhum handler foi encontrado. Lança um erro.
        throw IllegalArgumentException("Nenhum parser compatível encontrado para o JSON fornecido.")
    }
}