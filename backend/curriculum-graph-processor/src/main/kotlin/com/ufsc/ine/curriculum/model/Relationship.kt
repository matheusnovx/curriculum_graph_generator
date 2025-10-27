package com.ufsc.ine.curriculum.model

// Representa os diferentes tipos de arestas (relações) entre os nós.
sealed class Relationship {
    abstract val from: String // ID do nó de origem
    abstract val to: String   // ID do nó de destino

    data class Prerequisite(override val from: String, override val to: String) : Relationship()
    data class Corequisite(override val from: String, override val to: String) : Relationship()
    data class Equivalence(override val from: String, override val to: String) : Relationship()
}