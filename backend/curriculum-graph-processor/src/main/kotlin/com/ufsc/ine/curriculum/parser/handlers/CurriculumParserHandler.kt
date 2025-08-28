package com.ufsc.ine.curriculum.parser.handlers

import com.ufsc.ine.curriculum.model.CurriculumGraph
import kotlinx.serialization.json.JsonObject

// Contrato para qualquer parser de uma versão específica do currículo.
interface CurriculumParserHandler {
    /**
     * Verifica se este handler é capaz de processar o JSON fornecido.
     * @param root O objeto JSON raiz.
     * @return True se o handler pode processar, False caso contrário.
     */
    fun canParse(root: JsonObject): Boolean

    /**
     * Processa o JSON e o transforma em nosso modelo de grafo.
     * @param root O objeto JSON raiz.
     * @return Uma lista de CurriculumGraph, pois um JSON pode conter múltiplos currículos.
     */
    fun parse(root: JsonObject): List<CurriculumGraph>

    var next: CurriculumParserHandler?
}