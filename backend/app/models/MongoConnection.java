// The MongoConnection class encapsulates objects associated with
// the database, particularly the connection itself, mongoClient,
// and the documents stored in the database, collection.
//
// Its design is based on the assumption that the caller only 
// requires access to a specific collection rather than multiple.
//
// The constructor receives the information necessary to establish
// a connection through a properties file. The properties file should
// be stored in the conf/ directory. 

package models;

import play.Play;
import play.Application;

// following are necessary for handling properties files
import java.io.InputStream;
import java.util.Properties;

import com.mongodb.MongoClient;
import com.mongodb.MongoClientURI;
// following is necessary for MongoCollection
import com.mongodb.client.*;
import org.bson.Document;

class MongoConnection
{
  private Properties                  properties;
  private MongoClient                 mongoClient;
  private MongoCollection<Document>   collection;

  // connects to a mongodb instance as defined in the properties file
  // whose name is taken as a parameter with the following format:
  // URI=
  // db=
  // collection=
  public MongoConnection(String properties_file)
  {
    properties = getProperties(properties_file);

    MongoClientURI connectionString = 
                  new MongoClientURI(properties.getProperty("URI"));
    mongoClient = new MongoClient(connectionString);

    MongoDatabase db = mongoClient.getDatabase(properties.getProperty("db"));
    collection = db.getCollection(properties.getProperty("collection"));
  }

  public void close()
  {
    mongoClient.close();
  }

  public MongoCollection<Document> getCollection()
  {
    return collection;
  }

  private Properties getProperties(String filename)
  {
    Properties p = new Properties();
    InputStream is;

    // get URI from properties file
    try {
      // reads file from classpath and returns a input stream
      is = Play.application().resourceAsStream(filename);
      // following throw IOException
      p.load(is);
      is.close();
    } catch(java.io.IOException e) {
      // check that properties file is in conf/ directory.
      System.out.println("issue interfacing with the properties file.");
      return null;
    }

    return p;
  }
}
