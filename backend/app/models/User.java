package models;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

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
    document.append("email_lower", email.toLowerCase());
    document.append("password", Base64.getEncoder().encodeToString(hashed));
    document.append("sessions", new Document());
    document.append("sessionIDs", new ArrayList<Integer>());
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
    if(collection.find(eq("email_lower", Email.toLowerCase())).first() == null) { 
      ret = false;
    }
    mc.close();
    return ret;
  }

  public static User find(String Email)
  {
    MongoConnection mc = new MongoConnection("db.properties");
    MongoCollection<Document> collection = mc.getCollection();

    return new User(collection.find(eq("email_lower", Email.toLowerCase())).first());
  }

  public static boolean authenticate(String Email, String Password)
  {
    boolean ret = true;
    MongoConnection mc = new MongoConnection("db.properties");
    MongoCollection<Document> collection = mc.getCollection();
    Document d = collection.find(eq("email_lower", Email.toLowerCase())).first();

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

  public void addSession(String name, String description, String id) {
    Document sessions = (Document)document.get("sessions");
    Document session = (Document)sessions.get("sessionID");

    if(session != null) {
      session.put("name", name);
      session.put("description", description);
    } else {
      session = new Document("name", name);

      session.put("description", description);
      session.put("id", id);
      session.put("history", new ArrayList<String>());
      session.put("saved", new ArrayList<String>());
      session.put("documents", new Document());
      sessions.put(id, session);
    }
  }

  public void removeSession(String id) {
    Document sessions = (Document)document.get("sessions");
    sessions.remove(id);
  }

  public JsonNode getSessions() {
    Document sessions = (Document)document.get("sessions");
    JsonNode result = JsonNodeFactory.instance.objectNode();
    ObjectMapper om = new ObjectMapper();
    String jsonString = null;

    try {
      jsonString = sessions.toJson();
      result = om.readTree(jsonString);
    } catch(java.io.IOException e) {
      System.out.println("encountered an IOException in User.getSessions()");
      e.printStackTrace();
    }

    return result;
  }

  // adds document to the document history
  public void addDocumentToHistory(String sessionID, String documentID) {
    Document sessions = (Document)document.get("sessions");
    Document session = (Document)sessions.get(sessionID);

    if(session != null) {
      List<String> history = (ArrayList<String>)session.get("history");

      if(history.contains(documentID)) {
        // move document to the front of the list without
        // duplicating the document
        history.remove(documentID);
      }

      history.add(0, documentID);
    }
  }

  public ArrayNode getDocumentHistory(String sessionID) {
    Document sessions = (Document)document.get("sessions");
    Document session = (Document)sessions.get(sessionID);
    ArrayNode result = JsonNodeFactory.instance.arrayNode();

    if(session != null) {
      ArrayList<String> history = (ArrayList<String>)session.get("history");

      for(int i = 0; i < history.size(); ++i) {
        result.add(history.get(i));
      }
    }
    return result;
  }

  public ArrayNode getAnnotatedDocuments(String sessionID) {
    Document sessions = (Document)document.get("sessions");
    Document session = (Document)sessions.get(sessionID);
    ArrayNode result = JsonNodeFactory.instance.arrayNode();

    if(session != null) {
      Document documents = (Document)session.get("documents");
      Set<String> annotated = documents.keySet();
      Iterator<String> itr = annotated.iterator();

      while(itr.hasNext()) {
        result.add(itr.next());
      }
    }
    return result;
  }
  public void addHighlight(String sessionID, String documentID, int startIndex,
                           int stopIndex) {
    Document sessions = (Document)document.get("sessions");
    Document session = (Document)sessions.get(sessionID);

    if(session != null) {
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
    }
  }

  public JsonNode getHighlights(String sessionID, String documentID) {
    Document sessions = (Document)document.get("sessions");
    Document session = (Document)sessions.get(sessionID);
    JsonNode result = null;
    ObjectMapper om = new ObjectMapper();

    if(session != null) {
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
    }

    return result;
  }

  public void saveDocument(String sessionID, String documentID) {
    Document sessions = (Document)document.get("sessions");
    Document session = (Document)sessions.get(sessionID);

    if(session != null) {
      List<String> saved = (ArrayList<String>)session.get("saved");

      if(!saved.contains(documentID)) {
        saved.add(0, documentID);
      }
    }
  }

  public void unsaveDocument(String sessionID, String documentID) {
    Document sessions = (Document)document.get("sessions");
    Document session = (Document)sessions.get(sessionID);

    if(session != null) {
      List<String> saved = (ArrayList<String>)session.get("saved");

      if(saved.contains(documentID)) {
        saved.remove(documentID);
      }
    }
  }

  public boolean savedDocument(String sessionID, String documentID) {
    Document sessions = (Document)document.get("sessions");
    Document session = (Document)sessions.get(sessionID);

    if(session != null) {
      List<String> saved = (ArrayList<String>)session.get("saved");

      if(saved.contains(documentID)) {
        return true;
      }
    }
    return false;
  }

  public ArrayNode getSavedDocuments(String sessionID) {
    Document sessions = (Document)document.get("sessions");
    Document session = (Document)sessions.get(sessionID);
    ArrayNode result = JsonNodeFactory.instance.arrayNode();

    if(session != null) {
      ArrayList<String> saved = (ArrayList<String>)session.get("saved");

      for(int i = 0; i < saved.size(); ++i) {
        result.add(saved.get(i));
      }
    }

    return result;
  }
}
