import pickle
import sys
from sentence_transformers import SentenceTransformer
import joblib

from sklearn.metrics.pairwise import cosine_similarity

def load_model_and_predict(input_text):
    # Load the model from the .pkl file
    Embeddings = joblib.load('model.pkl')
    
    # Load the SentenceTransformer model
    model = SentenceTransformer("all-MiniLM-L6-v2")
    
    # Encode the input text
    input_encoding = model.encode(input_text, normalize_embeddings=False)
    
    # Calculate similarity scores
    Embeddings["Similarity_Score"] = (Embeddings["ada_embedding"].apply(lambda x: cosine_similarity([x], [input_encoding])[0][0]) * 3) + \
                                     ((Embeddings["specialisation_embedding"].apply(lambda x: cosine_similarity([x], [input_encoding])[0][0])) * 4) + \
                                     ((Embeddings["primary_embedding"].apply(lambda x: cosine_similarity([x], [input_encoding])[0][0])) * 3) + \
                                     ((Embeddings["Experience_Industry"].apply(lambda x: cosine_similarity([x], [input_encoding])[0][0])) * 2)
    
    # Sort and return results
    result = Embeddings.sort_values(by='Similarity_Score', ascending=False)["TA_ID"].tolist()
    return result

if __name__ == "__main__":
    # Command line argument: <input_text>
    input_text = sys.argv[1]
    # input_text = "Computer"

    # Make prediction
    prediction = load_model_and_predict(input_text)

    # Print the prediction
    # print("Hello World")
    print(prediction)
