# Geração de Grafos Curriculares

* **Frontend**: Next.js (React)
* **Backend (Processamento)**: Ktor (Kotlin) com scripts Python
* **Banco de Dados**: Neo4j

## 1. Pré-requisitos

Antes de começar, garanta que você tenha os seguintes softwares instalados:

* **Git**: Para clonar o repositório.
* **Docker e Docker Compose**: Essencial para rodar o ambiente.
    * *Recomendação (macOS):* [Docker Desktop](https://www.docker.com/products/docker-desktop/) ou [Colima](https://github.com/abiosoft/colima). (É recomendado alocar pelo menos 8GB de RAM para o Docker).

## 2. Configuração Inicial (Passo a passo)

Este projeto depende de arquivos de dados JSON para popular o banco. Esses arquivos **não estão** no repositório e devem ser adicionados manualmente.

### Passo 1: Clonar o Repositório

```bash
git clone [https://github.com/matheusnovx/curriculum_graph_generator.git](https://github.com/matheusnovx/curriculum_graph_generator.git)
cd curriculum_graph_generator
```

### Passo 2: Adicionar os Dados de Turmas

O script de população (`db-populator`) espera encontrar os arquivos JSON de turmas em uma pasta específica.

1.  Dentro da pasta `backend/`, crie um novo diretório chamado `turmas_20252`:

    ```bash
    mkdir -p backend/turmas_20252
    ```

2.  **Copie todos os seus arquivos `.json` de turmas** para dentro desta nova pasta.

A estrutura final deve ser:

```
curriculum_graph_generator/
├── backend/
│   ├── turmas_20252/
│   │   ├── arquivo1.json
│   │   ├── arquivo2.json
│   │   └── ...
│   ├── src/
│   └── ...
└── ...
```

## 3. Como Rodar o Projeto

O projeto agora é executado em duas etapas: primeiro, subimos os serviços principais; segundo, rodamos o script para popular o banco de dados.

### Passo 1: Iniciar os Serviços Principais

Execute o comando abaixo na raiz do projeto. Isso irá construir as imagens e iniciar os serviços `frontend`, `backend`, e `neo4j`.

```bash
docker-compose up -d --build
```

* O `docker-compose.yml` está configurado com `profiles`, então este comando **NÃO** irá rodar o populador do banco.
* O serviço `backend` irá iniciar, mas ficará em modo de espera (com `tail -f`).
* O banco de dados `neo4j` estará **vazio** neste momento.

### Passo 2: Popular o Banco de Dados

Após os serviços estarem rodando (pode levar um minuto para o Neo4j ficar "healthy"), execute o seguinte comando:

```bash
docker-compose run --rm db-populator
```

* Este comando executa o serviço `db-populator`, que foi definido com o perfil `populate`.
* Ele irá esperar o Neo4j estar 100% pronto (graças ao `healthcheck`).
* Em seguida, ele executará o script `Main.kt` (que por sua vez chama o `atualizar_turmas.py`) para ler todos os JSONs da pasta `turmas_20252` e inseri-los no Neo4j.
* O flag `--rm` remove o contêiner do populador após a conclusão, pois ele é uma tarefa de execução única (one-shot).

**Você só precisa executar o Passo 2 uma vez.** Os dados serão salvos permanentemente no volume `neo4j_data`.

## 4. Acessando a Aplicação

Após os passos acima, a aplicação estará disponível nos seguintes endereços:

* 🌐 **Aplicação Frontend**: `http://localhost:3000`
* 💾 **Banco de Dados (Neo4j Browser)**: `http://localhost:7474`
    * *Nota: A autenticação foi desabilitada (`NEO4J_AUTH=none`). Você pode se conectar sem usuário ou senha.*

## 5. Comandos Úteis

### Parar a Aplicação

Para parar todos os contêineres:

```bash
docker-compose down
```

### Resetar o Banco de Dados

Se você quiser apagar completamente o banco de dados e começar do zero (exigirá rodar o `db-populator` novamente):

```bash
docker-compose down -v
```

### Ver os Logs

Para ver os logs de todos os serviços em tempo real:

```bash
docker-compose logs -f
```

Para ver os logs de um serviço específico (ex: `frontend`):

```bash
docker-compose logs -f frontend
```