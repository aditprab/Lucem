package models;

import java.util.Arrays;
import java.util.Base64;
import java.security.MessageDigest;
// following is necessary for MongoCollection
import com.mongodb.client.*;
import org.bson.Document;
import com.mongodb.client.model.Filters;

public class User {
  private Long id;
  private String email;
  // password is stored as byte array rather than string so that it can
  // be written over to mitigate the risk of still being able to read
  // a password after it is deallocated.
  private byte[] password;

  // public Session array or whatever

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

  public User(String Email, String Password)
  {
    email = Email;

    // hash password prior to storing it
    password = hash(Password);
    if(password == null) {
      // hash method threw a NoSuchAlgorithmException. should not
      // continue.
      System.out.println("encountered error when trying to create new user");
      return;
    }

    // save user to the db
    MongoConnection mc = new MongoConnection("db.properties");
    MongoCollection<Document> collection = mc.getCollection();
    Document user = new Document("email", email);
    user.append("password", Base64.getEncoder().encodeToString(password));
    collection.insertOne(user);
    mc.close();
  }

  public static boolean exists(String Email)
  {
    boolean ret = true;
    MongoConnection mc = new MongoConnection("db.properties");
    MongoCollection<Document> collection = mc.getCollection();
    if(collection.find(Filters.regex("email", Email, "i")).first() == null) { 
      ret = false;
    }
    mc.close();
    return ret;
  }

  public static boolean authenticate(String Email, String Password)
  {
    boolean ret = true;
    MongoConnection mc = new MongoConnection("db.properties");
    MongoCollection<Document> collection = mc.getCollection();
    Document d = collection.find(Filters.regex("email", Email, "i")).first();
    if(d == null) {
      // user does not exist
      ret = false;
    } else {
      String passwordString = d.get("password").toString();
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
}
