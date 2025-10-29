package com.ufsc.ine.curriculum.config

import org.neo4j.driver.AuthTokens
import org.neo4j.driver.Driver
import org.neo4j.driver.GraphDatabase

object Neo4jDriverFactory {
    val driver: Driver by lazy {
        val uri = System.getenv("NEO4J_URI") ?: "bolt://neo4j:7687"

        GraphDatabase.driver(uri, AuthTokens.none())
    }
}
