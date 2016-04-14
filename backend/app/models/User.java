package models;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;

import java.security.MessageDigest;

// following is necessary for MongoCollection
import com.mongodb.client.*;

import static com.mongodb.client.model.Filters.*;

import org.bson.Document;

// following is necessary to return JsonNodes
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.fasterxml.jackson.core.JsonProcessingException;

public class User {

  private Document document;

  private static byte[] hash(String password)
  {
    MessageDigest sha;
    try {
      sha = MessageDigest.getInstance("SHA-256");
    } catch(java.security.NoSuchAlgorithmException e) {
      return null;
    }
    byte [] passBytes = password.getBytes();

    return sha.digest(passBytes);
  }

  public User(String email, String password) {
    byte[] hashed = hash(password);

    if(hashed == null) {
      // hash method threw a NoSuchAlgorithmException. should not
      // continue.
      System.out.println("encountered error when trying to create new user");
      return;
    }

    // save user to the db
    document = new Document("email", email);
    document.append("password", Base64.getEncoder().encodeToString(hashed));
    document.append("sessions", new ArrayList<Document>());
    save(false);
  }

  private User(Document document) {
    this.document = document;
  }

  public Document getDocument() {
    return document;
  }
  
  public static boolean exists(String Email)
  {
    boolean ret = true;
    MongoConnection mc = new MongoConnection("db.properties");
    MongoCollection<Document> collection = mc.getCollection();
    if(collection.find(eq("email", Email)).first() == null) { 
      ret = false;
    }
    mc.close();
    return ret;
  }

  public static User find(String Email)
  {
    MongoConnection mc = new MongoConnection("db.properties");
    MongoCollection<Document> collection = mc.getCollection();

    return new User(collection.find(eq("email", Email)).first());
  }

  public static boolean authenticate(String Email, String Password)
  {
    boolean ret = true;
    MongoConnection mc = new MongoConnection("db.properties");
    MongoCollection<Document> collection = mc.getCollection();
    Document d = collection.find(eq("email", Email)).first();
    if(d == null) {
      // user does not exist
      ret = false;
    } else {
      String passwordString = d.getString("password");
      byte [] passHash = hash(Password),
              passAct = Base64.getDecoder().decode(passwordString);
      if(passHash == null) {
        System.out.println("encountered an error while trying to authenticate");
        ret = false;
      } else if(!Arrays.equals(passHash, passAct)) {
        // password entered does not match up with the one stored in the db
        ret = false;
      }
    }
    mc.close();
    return ret;
  }

  private void save(boolean replace) {
    MongoConnection mc = new MongoConnection("db.properties");
    MongoCollection<Document> collection = mc.getCollection();

    if(replace) {
      String key = "email";
      if(collection.findOneAndReplace(eq(key, document.getString(key)), document) == null) {
        collection.insertOne(document);
      };
    } else {
      collection.insertOne(document);
    }

    mc.close();
  }

  public void addSession(String name, String description, int id) {
    List<Document> sessions = (List<Document>)document.get("sessions");
    Document session = new Document("name", name);
    session.put("description", description);
    session.put("id", id);
    session.put("history", new ArrayList<Document>());
    session.put("documents", new Document());
    sessions.add(session);
  }

  // untested
  public void removeSession(long id) {
    List<Document> sessions = (List<Document>)document.get("sessions");

    for(int i = 0; i < sessions.size(); ++i) {
      Document session = sessions.get(i);
      if(id == (long)session.get("id")) {
        sessions.remove(i);
        break;
      }
    }
  }

  public ArrayNode getSessions() {
    List<Document> sessions = (ArrayList<Document>)document.get("sessions");
    ArrayNode result = JsonNodeFactory.instance.arrayNode();
    ObjectMapper om = new ObjectMapper();
    String jsonString = null;

    for(int i = 0; i < sessions.size(); ++i) {
      Document session = sessions.get(i);
      String s = null;

      try {
        s = session.toJson();
        result.add(om.readTree(s));
      } catch(java.io.IOException e) {
        System.out.println("encountered an IOException in User.getSessions()");
        e.printStackTrace();
      }
    }

    return result;
  }

  public void addDocument(int sessionID, String documentID) {
    List<Document> sessions = (ArrayList<Document>)document.get("sessions");

    for(int i = 0; i < sessions.size(); ++i) {
      Document session = sessions.get(i);
      if(session.getInteger("id", -1) == sessionID) {
        List<String> history = (ArrayList<String>)session.get("history");
        Document documents = (Document)session.get("documents");
        Document document = (Document)documents.get(documentID);

        if(document != null) {
          // move document to the front of the list without
          // duplicating the document
          history.remove(documentID);
        }

        history.add(0, documentID);

        break;
      }
    }
  }

  public void addHighlight(int sessionID, String documentID, int startIndex,
                           int stopIndex) {
    List<Document> sessions = (ArrayList<Document>)document.get("sessions");

    for(int i = 0; i < sessions.size(); ++i) {
      Document session = sessions.get(i);
      if(session.getInteger("id", -1) == sessionID) {
        Document documents = (Document)session.get("documents");
        Document document = (Document)documents.get(documentID);
        Document highlights;

        if(document == null) {
          document = new Document("id", documentID);
          document.put("highlights", new Document());
          documents.put(documentID, document);
        }

        highlights = (Document)document.get("highlights");

        // to add notes, just create a new document and add stop index as
        // a key value pair
        highlights.put(Integer.toString(startIndex), stopIndex);

        break;
      }
    }
  }

  public JsonNode getHighlights(int sessionID, String documentID) {
    List<Document> sessions = (ArrayList<Document>)document.get("sessions");
    JsonNode result = null;
    ObjectMapper om = new ObjectMapper();

    for(int i = 0; i < sessions.size(); ++i) {
      Document session = sessions.get(i);
      if(session.getInteger("id", -1) == sessionID) {
        Document documents = (Document)session.get("documents");
        Document document = (Document)documents.get(documentID);
        Document highlights;

        if(document == null) {
          return (JsonNode)JsonNodeFactory.instance.objectNode();
        }

        highlights = (Document)document.get("highlights");

        if(highlights == null || highlights.isEmpty()) {
          return (JsonNode)JsonNodeFactory.instance.objectNode();
        }

        try {
          String h = highlights.toJson();
          result = om.readTree(h);
        } catch(java.io.IOException e) {
          System.out.println("encountered an IOException in User.getHighlights()");
          e.printStackTrace();
        }
        break;
      }
    }

    return result;
  }
}
