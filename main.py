import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_classic.vectorstores import Chroma
from langchain_groq import ChatGroq
from langchain_classic.chains import RetrievalQA
class LocalRAGSystem:
    def __init__(self):
        print("Initializing RAG System...")
        load_dotenv()  
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        self.groq_api_key = os.getenv("GROQ_API_KEY")

        if not self.gemini_api_key or not self.groq_api_key:
            raise ValueError("Missing API Keys in .env  file")
        print("API Keys loaded successfully.")

        self.splits = None
        self.vector_store = None
    def ingest_document(self, file_path):
        print(f"Loading document from {file_path}")
        loader = PyPDFLoader(file_path)
        doc = loader.load()

        print("Splitting document")
        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=200)
        self.splits = splitter.split_documents(doc)
        print(f"Split into {len(self.splits)} chunks")

    def setup_database(self):
        if not self.splits:
            raise ValueError("No document splits available. Please ingest a document first.")

        print("inittializing embeddings and  chroma databae")
        embeddings = GoogleGenerativeAIEmbeddings(
            model = "models/gemini-embedding-001",
            google_api_key=self.gemini_api_key)
        self.vector_store = Chroma(
            embedding_function=embeddings,
            persist_directory="./chroma_db",
            collection_name="EXCEL_Campus_Rules_docs"
        )
        self.vector_store.add_documents(self.splits)
        self.retriever = self.vector_store.as_retriever(search_kwargs={"k": 2})

    def setup_llm_chain(self):
        print("iniitializing groq llm")
        llm = ChatGroq(
            model="openai/gpt-oss-20b",
            api_key=self.groq_api_key,
            temperature=0.3,
        )
        self.qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            retriever=self.retriever,
            return_source_documents=True
        )
        print("pipeline is ready")
        
    def ask(self, query):
        print(f"\n Asking: {query}")
        response =self .qa_chain.invoke({"query": query})
        print(f"Answer: {response['result']}\n")



if __name__ == "__main__":
    rag = LocalRAGSystem()        
    rag.ingest_document("./EXCEL COLLEGE CAMPUS RULES.pdf")
    rag.setup_database()
    rag.setup_llm_chain()
    rag.ask("WHERE IS THE PLACEMENT CELL?")