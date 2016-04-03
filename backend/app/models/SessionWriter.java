package models;

import java.lang.Runnable;

import com.fasterxml.jackson.databind.JsonNode;

import com.mongodb.client.*;
import org.bson.Document;
import static com.mongodb.client.model.Filters.*;

public class SessionWriter implements Runnable {

  private final User user;

  public SessionWriter(User user) {
    this.user = user;
  }

  public void run() {
    MongoConnection mc = new MongoConnection("db.properties");
    MongoCollection<Document> collection = mc.getCollection();
    Document userDoc = user.getDocument();
    String key = "email";

    if(collection.findOneAndReplace(eq(key, userDoc.get(key)), userDoc) == null) {
      System.out.println("not found");
    }
    mc.close();
  }
}
