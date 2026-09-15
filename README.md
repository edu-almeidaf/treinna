# Treinna API - Instruções de Execução

Este documento contém os passos necessários para levantar o ambiente de desenvolvimento local (API Node.js + MongoDB) utilizando Docker.

## Pré-requisitos

Certifique-se de ter as seguintes ferramentas instaladas na sua máquina:
* [Docker](https://docs.docker.com/get-docker/)
* [Docker Compose](https://docs.docker.com/compose/install/)
* Um API Client como [Bruno](https://www.usebruno.com/), [Postman](https://www.postman.com/) ou [Insomnia](https://insomnia.rest/).

## Como rodar o projeto

1. Abra o terminal na pasta raiz do repositório.
2. Conceda permissão de execução ao script de inicialização (necessário apenas na primeira vez):
   ```bash
   chmod +x iniciar.sh
   ```
3. Execute o script. Ele fará o build da API, levantará os containers e executará a carga inicial de dados no MongoDB:
   ```bash
   ./iniciar.sh
   ```

## Serviços Disponíveis

Após o término da execução do script, os seguintes serviços estarão ativos e mapeados nas portas locais:

* **API REST (Node.js):** [http://localhost:3400](http://localhost:3400)
* **Mongo Express (Interface visual do BD):** [http://localhost:8401](http://localhost:8401)

## Como testar a API (Collection)

O projeto inclui um arquivo `treinna-collection.json` na raiz, contendo todas as 5 requisições de negócio exigidas já configuradas.

**Para importar e testar no Bruno:**
1. Abra o aplicativo **Bruno**.
2. Na tela inicial, clique em **Import Collection** e escolha a opção **Postman Collection**.
3. Selecione o arquivo `treinna-collection.json` na pasta do projeto e confirme.
4. *Atenção:* Para testar as rotas de histórico e atualização (rotas 3, 4 e 5), acesse o Mongo Express (`http://localhost:8401`), copie um `_id` real da entidade correspondente no banco e substitua as marcações como `COLE_O_ID...` direto na URL ou no corpo (body) da requisição.

*(Nota: Como o arquivo exportado está no formato padrão Postman Collection v2.1.0, o processo de importação é idêntico caso prefira utilizar o Postman ou o Insomnia).*

## Como parar o ambiente

Para encerrar a execução e remover os containers do projeto de forma limpa, execute:
```bash
docker compose down
```