# Gerador e Visualizador de Grafo de Currículo

Este repositório contém um conjunto de ferramentas para processar, armazenar e visualizar grafos de currículos acadêmicos. O projeto é dividido em três componentes principais:

1.  **Backend (Kotlin):** Um processador de dados (`backend/curriculum-graph-processor`) que lê arquivos JSON de currículo, analisa as dependências e os carrega em um banco de dados de grafo Neo4j.
2.  **Banco de Dados (Neo4j):** Atua como a principal fonte de verdade para as disciplinas e seus relacionamentos. É essencial para o funcionamento do backend Kotlin e do frontend Next.js.
3.  **Frontend (Next.js):** Uma interface web (`curriculum-graph-gen`) que se conecta ao banco Neo4j para buscar os dados do grafo e renderizá-los interativamente usando Reactflow.
4.  **Backend (Python):** Um gerador de grafos alternativo (`graph-gen`) que utiliza Python e Graphviz para criar visualizações estáticas (arquivos `.svg`) a partir dos arquivos JSON.

## Requisitos do Sistema

Antes de começar, garanta que você tenha os seguintes softwares instalados:

* Git
* Docker (Recomendado para o Neo4j)
* JDK 17 ou superior (para o backend Kotlin)
* Node.js 16 ou superior (para o frontend Next.js)
* Python 3.9 ou superior (para o gerador Python)
* Graphviz (dependência do gerador Python)

---

## 1. Configuração Obrigatória: Banco de Dados Neo4j

O fluxo principal do projeto (backend Kotlin e frontend Next.js) depende de uma instância ativa do Neo4j.

O backend em Kotlin e o frontend em Next.js são configurados para se conectar a um banco Neo4j local com credenciais específicas. A forma mais simples de configurar isso é usando o Docker.

Execute o comando a seguir no seu terminal para iniciar um contêiner Neo4j com as credenciais corretas:

```bash
docker run \
    --name neo4j-tcc \
    -p 7687:7687 \
    -p 7474:7474 \
    -e NEO4J_AUTH="neo4j/Matheus2001" \
    neo4j:latest
```

**Você deve manter este contêiner em execução** enquanto utiliza o backend Kotlin e o frontend.

## 2. Instalação e execução — Frontend (Next.js)
```bash
git clone [https://github.com/seuusuario/curriculum_graph_generator.git](https://github.com/seuusuario/curriculum_graph_generator.git)
cd curriculum_graph_generator
```

Siga os passos abaixo para rodar os componentes principais (Kotlin e Next.js).

### Scripts Python — instalar dependências

Recomendo criar e ativar um ambiente virtual antes de instalar as dependências:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Em seguida instale as dependências do arquivo `requirements.txt` (arquivo adicionado na raiz do repositório):

```bash
pip install -r requirements.txt
```

### A. Backend: Processador Kotlin (Carregar dados no Neo4j)

Este componente irá ler os arquivos JSON de currículo localizados em backend/curriculum-graph-processor/src/main/resources/ e popular seu banco Neo4j.

Navegue até o diretório do backend Kotlin:

```bash
cd backend/curriculum-graph-processor
```

Execute o aplicativo usando o Gradle Wrapper. Isso irá compilar o código e executar a lógica de processamento principal:

```bash
./gradlew run

```
Ao final da execução, seu banco Neo4j estará populado com os nós (Disciplinas) e relacionamentos (Pré-requisitos).

### B. Frontend: Visualizador Next.js

Este componente se conecta ao banco Neo4j (populado pelo passo anterior) para exibir o grafo.

Em um novo terminal, navegue até o diretório do frontend:

```bash
cd curriculum-graph-gen
```
Instale as dependências do Node.js:

```bash
npm install
```
Inicie o servidor de desenvolvimento:

```bash
npm run dev

```
Abra http://localhost:3000 no seu navegador para visualizar e interagir com o grafo do currículo.
