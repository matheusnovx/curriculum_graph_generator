# Gerador de Grafo de Currículo

Este repositório contém a interface web (Next.js) e scripts auxiliares em Python e utilitários relacionados à geração e ao processamento de dados de turmas/currículos.

## Estrutura relevante

- Frontend (Next.js): `curriculum-graph-gen/`
  - Página principal: `curriculum-graph-gen/src/app/page.tsx`
  - Parsers auxiliares em Python (usados pelo app): `curriculum-graph-gen/src/app/lib/parsers/pdf_parser.py`

- Scripts Python úteis:
  - `backend/atualizar_turmas.py` — importa arquivos JSON de turmas para um banco Neo4j.
  - `graph-gen/turmas/download_turmas.py` — script para baixar JSONs de turmas do endpoint SISACAD (UFSC).

- Backend/Processador Kotlin (opcional): `backend/curriculum-graph-processor/` (projeto Gradle/Kotlin)

## Requisitos (essenciais)

- Node.js 16+ (para frontend)
- Python 3.9+ (para executar scripts Python)
- Neo4j (se for usar `backend/atualizar_turmas.py`)
- Java 11+ / Gradle (somente se você for executar o processador Kotlin opcional)

Observação: há um arquivo `requirements.txt` gerado para os scripts Python na raiz do repositório (veja abaixo). Use um ambiente virtual Python para instalar as dependências.

## Instalação e execução — Frontend (Next.js)

1. Entre no diretório do frontend:

```bash
cd curriculum-graph-gen
```

2. Instale dependências:

```bash
npm install
# ou
yarn
# ou
pnpm install
```

3. Rode o servidor de desenvolvimento:

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

4. Abra no navegador:

```
http://localhost:3000
```

## Scripts Python — instalar dependências

Recomendo criar e ativar um ambiente virtual antes de instalar as dependências:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Em seguida instale as dependências do arquivo `requirements.txt` (arquivo adicionado na raiz do repositório):

```bash
pip install -r requirements.txt
```

### Principais scripts Python e como usá-los

- `backend/atualizar_turmas.py` — importa arquivos JSON de turmas (pasta `backend/turmas_20252`) para um banco Neo4j.

  - Configure as credenciais e URI do Neo4j no topo do arquivo (ou substitua por variáveis de ambiente/localmente). Exemplo de execução:

  ```bash
  python backend/atualizar_turmas.py
  ```

  - Observações: o script espera que exista um nó `Course` com `courseId` correspondente às turmas antes de criar as relações `OFFERS`. Se ocorrerem erros de Cypher, verifique se os nós `Course` estão presentes no seu banco.

- `curriculum-graph-gen/src/app/lib/parsers/pdf_parser.py` — parser de PDFs de histórico/currículo. Exemplo de execução:

```bash
python curriculum-graph-gen/src/app/lib/parsers/pdf_parser.py /caminho/para/arquivo.pdf
```

- `graph-gen/turmas/download_turmas.py` — realiza requisições ao endpoint SISACAD para baixar arquivos JSON de turmas. Exemplo:

```bash
python graph-gen/turmas/download_turmas.py
```

## Executando o backend Kotlin (opcional)

Se você quiser executar o processador Kotlin (quando aplicável):

1. Entre no diretório:

```bash
cd backend/curriculum-graph-processor
```

2. Execute usando o Gradle wrapper:

```bash
./gradlew run
```

ou para buildar um JAR:

```bash
./gradlew build
java -jar build/libs/*.jar
```
