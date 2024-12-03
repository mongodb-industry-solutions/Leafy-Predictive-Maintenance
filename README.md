# Leafy-Predictive-Maintenance

This demo demonstrates MongoDB Atlas’s capabilities for predictive maintenance through three key features: 
- **Equipment Criticality Analysis** for prioritizing machines using AI and semantic searches
- **Failure Prediction** for real-time failure forecasts and visualizations
- **Repair Plan Generation** for creating detailed maintenance work orders.

Discover how these tools streamline maintenance processes and optimize machine performance.

## Step 1: Create a MongoDB Atlas Instance

1. Create a MongoDB Atlas instance if you don't already have one. Our recommended name for cluster is "Smart-Factory-Cluster". 
2. Create a database and some collections. Our recommended name for database is "smart_factory". 

## Step 2. Configure Environment Variables

### For `predictive-maintenance-app`:

You will need to create a `.env` file inside the predictive-maintenance-app directory and add the following variables:

```env
MONGODB_CONNECTION_STRING=""
DATABASE=""
AI_MODEL_PROVIDER=""
FAILURES_COLLECTION=""
RAW_DATA_COLLECTION=""
TRANSFORMED_DATA_COLLECTION=""
MODELS_COLLECTION=""
MAINTAINENCE_HISTORY_COLLECTION=""
CRITICALITY_ANALYSIS_SEARCH_INDEX=""
CRITICALITY_ANALYSIS_SEARCH_INDEX_OPEN_AI=""
REPAIR_MANUALS_COLLECTION=""
REPAIR_PLAN_SEARCH_INDEX=""
REPAIR_PLAN_SEARCH_INDEX_OPEN_AI=""
OPENAI_API_KEY=""
OPENAI_API_MODEL=""
AWS_REGION=""
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
GCP_TRANSLATE_API_KEY=""
GCP_PROJECT_ID=""
NEXT_PUBLIC_ALERT_APP_URL="http://localhost:5003/"
NEXT_PUBLIC_DASHBOARD_URL=""
```

Replace the placeholder values with your actual configuration values. Some of the collections you will import in step 3.

> **_NOTE:_** The `AI_MODEL_PROVIDER` variable determines which AI model provider is used by the application. It can be set to either `openai` or `cohere`. Ensure that the necessary API keys and configurations for the selected provider are correctly set in your environment variables.

Recommended names for collections are listed below. 
```
DATABASE="smart_factory"
FAILURES_COLLECTION="machine_failures"
RAW_DATA_COLLECTION="raw_data"
TRANSFORMED_DATA_COLLECTION="transformed_data"
MODELS_COLLECTION="ml_models"
MAINTAINENCE_HISTORY_COLLECTION="maintenance_history"
REPAIR_MANUALS_COLLECTION="repair_manuals"
```

### Getting a GCP Translate API Key
You can create a free account and get a GCP Translate API key by following the [Google Cloud Platform's](https://cloud.google.com/gcp?utm_source=google&utm_medium=cpc&utm_campaign=emea-es-all-en-bkws-all-all-trial-e-gcp-1707574&utm_content=text-ad-none-any-DEV_c-CRE_500236788678-ADGP_Hybrid+%7C+BKWS+-+EXA+%7C+Txt+-+GCP+-+General+-+v3-KWID_43700060384861657-kwd-26415313501-userloc_1005424&utm_term=KW_google+cloud+platform-NET_g-PLAC_&&gad_source=1&gclid=CjwKCAjwp4m0BhBAEiwAsdc4aGWrFtSlO6P2himmtN7pEC2GGWxFBc7i-RD4vcuqTNRFur8u7w_RCxoCNEsQAvD_BwE&gclsrc=aw.ds&hl=en) instructions.
You will need to search for "Cloud Translation API" and create a new API key. Copy the API key and use it as your `GCP_TRANSLATE_API_KEY` in the .env file.

> [!NOTE]
> Feel free to use any other translation API, just make sure to make the necessary changes in the `translate.js` file.
      
### Integrating Atlas Charts
To integrate Atlas Charts, you will need to create a charts dashboard on MongoDB Atlas and copy the iframe link into the `NEXT_PUBLIC_APP_IFRAME_SRC`. Follow this [tutorial](https://www.mongodb.com/docs/charts/embedding-charts-iframe/) on how to get the iframe link from Atlas Charts.
Link the Atlas charts dashboard to machine_failures collection. You can create any widgets you want :)
We have also included a .charts file in [public](https://github.com/mongodb-industry-solutions/Leafy-Predictive-Maintenance/tree/main/public) folder. You can also use that. Just follow this [tutorial](https://www.mongodb.com/docs/charts/dashboards/dashboard-import-export) on how to import Charts.

### AWS 
To use the features provided by this project, you will need access to AWS with appropriate permissions. Specifically, we are using two models from Cohere which require requesting access.

#### Prerequisites
- An active AWS account.
- A user with necessary permissions to access AWS Bedrock.
- Access to the following Cohere models:
  - cohere.embed-english-v3 for embeddings.
  - cohere.command-r-v1:0 for completions.

#### Setup

Before you start, make sure you have an active AWS account with the necessary permissions and access to the required Cohere models as mentioned above.

#### Environment Variables

You will need to set up your environment variables correctly for this project to function properly. In a file named `.env`, replace the following placeholders with your own values:
```
AWS_REGION=your-aws-region
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
```

#### Models Used

We are utilizing AWS Bedrock for two primary functionalities: Embedding and Completion. For these tasks, we have chosen to use the following Cohere models:
- cohere.embed-english-v3 is used for embedding tasks.
- cohere.command-r-v1:0 is utilized for completion tasks. 

### OpenAI Integration

To use OpenAI’s features within this project, you will need an OpenAI API key and model name. Follow these steps to set up and configure OpenAI alongside the existing Cohere API integration.

#### Prerequisites
1. **OpenAI Account**: Sign up for an OpenAI account at [https://platform.openai.com/](https://platform.openai.com/).
2. **API Access**: Obtain an API key by navigating to your [API Keys page](https://platform.openai.com/account/api-keys).
3. **Model Selection**: Choose the OpenAI model you wish to use (e.g., `gpt-3.5-turbo`, `gpt-4`). 

#### Environment Variables
Add the following variables to your `.env` file:

```dotenv
OPENAI_API_KEY="your_open_ai_api_key"
OPENAI_API_MODEL="your_open_ai_model_name" # e.g., gpt-4
```

## Step 3: Add some Documents in MongoDB

Import the documents provided [here](https://github.com/mongodb-industry-solutions/Leafy-Predictive-Maintenance/tree/main/predictive-maintenance-app/collections) into Atlas. These include different PDFs (maintenance history document, maintenance instructions and repair plans) that will be used for retrieval-augmented generation in the demo.

The application setup is not finished. Now that you've uploaded the chunks and embeddings with metadata in MongoDB, in order to perform searches, you will need to create the index.

## Step 4: Create a Vector Search Index in MongoDB Atlas
Go to MongoDB Atlas and navigate to Atlas Search.

> **_NOTE:_** Remember that when creating a search index, the dimensions depend on the embedding model you use. For example, Cohere model `cohere.embed-english-v3` uses 1024 dimensions, while OpenAI model `text-embedding-3-small` uses 1536 dimensions. Ensure that your index configuration matches the dimensionality of the embeddings generated by your chosen model.


Click "Create Search Index" and select JSON Editor under Atlas Vector Search.
Choose the database and collection (REPAIR_MANUALS_COLLECTION) you created earlier.
Set "pred_maint_repair_index" as the Index Name and update your env file variable REPAIR_PLAN_SEARCH_INDEX.

Paste the following index definition in the edit box:
```
{
  "fields": [
    {
      "numDimensions": 1024,
      "path": "embeddings",
      "similarity": "euclidean",
      "type": "vector"
    }
  ]
}
```

Click "Next" and then "Create Search Index."

Follow the same steps to create one more index:

- Set "pred_maint_criticality_index" as the Index Name, for collection (MAINTAINENCE_HISTORY_COLLECTION) and paste the following index: 

```
{
  "fields": [
    {
      "numDimensions": 1024,
      "path": "embeddings",
      "similarity": "euclidean",
      "type": "vector"
    },
    {
      "path": "source.filename",
      "type": "filter"
    }
  ]
}
```
update your env file variable CRITICALITY_ANALYSIS_SEARCH_INDEX value

## Step 5. Running the Inference Script

First, make sure you imported the 'collections/smart_factory.ml_models.json' into MongoDB.

Next, install the necessary python dependencies and navigate to the `app/python` directory and execute the script with the following command separately:
`python inference.py`

Make sure you have an .env file in the same folder as inference.py with the required variables:

```env
MONGODB_CONNECTION_STRING=`"
DATABASE=""
FAILURES_COLLECTION=""
MODELS_COLLECTION=""
FEATURES_COLLECTION=""
TRANSFORMED_DATA_COLLECTION=""
```

This script performs automated predictive maintenance using MongoDB and a pre-trained machine learning model. If a failure is predicted, it logs the details to a failure collection. This process streamlines maintenance tasks by automatically detecting and recording potential machine issues.

## Step 6. Atlas Stream Processing Setup

1. Setup Atlas Stream Processing using this tutorial https://www.mongodb.com/docs/atlas/atlas-stream-processing/tutorial/
2. Use the pipeline in ```predictive-maintenance-app/ASP/ASP Pipeline``` file for the stream processor
3. Make sure to setup your source and sink collections as listed in the Pipeline

## Step 7. Run Alerts app

Navigate to the alerts-app directory:
```
cd alerts-app
```

Create a .env file with the following content:
```
MONGODB_CONNECTION_STRING="your_mongodb_uri"
DATABASE="your_mongodb_database"
```

Install the necessary dependencies:
```
npm install
```

Start the application:
```
node server.js
```

The application is now running on port 5003.


## Step 8. Run the Demo

### Install Dependencies

```
npm i
```

### Run Server

```
npm run dev
```
Use a browser to open the link http://localhost:3000/

Take a look at this [youtube video](https://www.youtube.com/watch?v=YwTWpUl3QS8) to understand how the demo works or read this [white paper](https://www.mongodb.com/resources/solutions/use-cases/generative-ai-predictive-maintenance-applications) and [blog](https://www.mongodb.com/blog/post/building-gen-ai-powered-predictive-maintenance-mongodb) for more explanation.


## Running It with Docker

Using Docker to run your application can simplify setup and ensure consistency across different environments. Follow these steps to build the image and run the container:

### Building and Running the Docker Containers

1. **Build the Docker Images**: To create the Docker images for your applications, use the `make build` command. This command typically executes the necessary `docker build` operations defined in your `Makefile`:

   ```bash
   make build
   ```

   > **Important Note:** This command will also create and start the containers.

2. **Removing the Docker Image and Container**: If you need to clean up or refresh your Docker environment, you can remove the Docker image and container using:

   ```
   make clean
   ```
