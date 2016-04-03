package models;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;

import java.security.MessageDigest;

// following is necessary for MongoCollection
import com.mongodb.BasicDBObject;
import com.mongodb.client.*;
import com.mongodb.DBObject;

import static com.mongodb.client.model.Filters.*;

import org.bson.Document;

// following is necessary to return JsonNodes
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;

import com.fasterxml.jackson.databind.JsonNode;
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
    document.append("sessions", new ArrayList<DBObject>());
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

  public void addSession(String name, String description) {
    List<DBObject> sessions = (List<DBObject>)document.get("sessions");
    BasicDBObject session = new BasicDBObject("name", name);
    session.put("description", description);
    session.put("documents", new ArrayList<DBObject>());
    sessions.add(session);
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
}
