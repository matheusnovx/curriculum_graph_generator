package com.ufsc.ine.curriculum.model

// A classe principal que representa o grafo completo de um currículo.
data class CurriculumGraph(
    // Esta é a linha que provavelmente está faltando ou com um nome diferente.
    val curriculumId: String,

    // Acesso rápido aos nós pelo ID (código da disciplina)
    val nodes: Map<String, CourseNode>,

    val relationships: List<Relationship>
)