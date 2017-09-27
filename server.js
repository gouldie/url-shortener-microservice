var mongodb = require('mongodb');
var express = require('express');
var app = express();

var MongoClient = mongodb.MongoClient;
var db_user = process.env.db_user;
var db_pass = process.env.db_pass;
var url = 'mongodb://' + db_user + ':' + db_pass + '@ds149954.mlab.com:49954/url-shortener';

var expression = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/
var regex = new RegExp(expression);

app.get("/", function(request, response) {
  response.send("Pass a URL into the querystring to receive a shortened version.")
})

app.get(/^\/(.+)/, function (request, response) {
  var isUrl = regex.test(request.params[0])
  var isNumber = /^\d+$/.test(request.params[0])
    
  if (!isUrl && !isNumber) {
    response.end("Please enter a valid URL or shortened link.")
  } else {
    MongoClient.connect(url, function (err, db) {
      if (err) {
        console.log('Unable to connect to the mongoDB server. Error:', err);
        response.send('failed to connect to db')
        db.close()
      } else {
        console.log('Connection established to', url);
        
        if (isUrl) {
          db.collection("links").findOne({ source: request.params[0] }, function(err, doc) {
            if (err) throw err

            if (doc) {
              // return existing docs redirect
              db.close()
              response.send({ source: doc.source, short: "https://url-shortener-mg-2.glitch.me/" + doc.short })
              response.end()
            } else {
              // create new doc and return redirect
              db.collection("links").insert({ source: request.params[0], short: Date.now() }, function(err, doc) {
                if (err) throw err
                db.close()
                response.send({ source: doc.ops[0].source, short: "https://url-shortener-mg-2.glitch.me/" + doc.ops[0].short  })
                response.end()
              })        
            }
          })
        } else {
          db.collection("links").findOne({ short: Number(request.params[0]) }, function(err, doc) {
            if (err) throw err
            
            if (doc) {
              // redirect
              db.close()
              response.redirect(doc.source)
              response.end();
            } else {
              db.close()
              response.end("This shortened url doesn't exist")
            }
          })
        }
      }
    });
  }
});


var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
