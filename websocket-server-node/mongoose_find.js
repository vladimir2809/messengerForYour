var mongoose = require('mongoose');
var dataBase = mongoose.connect('mongodb://localhost/words');
var wordSchema = require('./schemaMongoose.js').wordSchema;
var Words = mongoose.model('Words',wordSchema);
setTimeout(function () {
    mongoose.disconnect();
},3000);
//mongoose.connection.on('open', function () {
//    console.log(mongoose.connection.collection);
//    mongoose.connection.db.collectionNames(function (err, names) {
//        console.log(names)
//    });
//});
mongoose.connection.once('open', function () {
    var query = Words.count();//.where('first').in(['a', 'e', 'i', 'o', 'u',]);
  //  query.where('last').in(['a', 'e', 'i', 'o', 'u']);
  //  query.find();
    //  mongoose.connection.db.listCollections(function (err, names) {
        console.log(mongoose.connection.db.listCollections())
    //});
    query.exec(function (err, count) {
        console.log('\nThere are '+count+" words that "+"start and end with a vowel");
        // for (var i in docs)
        //{
        //  console.log(docs[i].word);
        //}

    });
    //query.find().limit(5).sort({ size: -1 });
    //query.exec(function (err, docs) {
    //    console.log('\nLongest 5 words that start and  end '+'with a vowel: ');
    //    console.error(err);
    //    for (var i in docs)
    //    {
    //        console.log(docs[i].word);
    //    }
    //});
    //query = Words.find();
    //query.mod('size',2,0);
    //query.where('size').gt(6);
    //query.limit(10);
    //query.select({word:1,size:1});
    //query.exec(function (err, docs) {
    //    console.log('\nWords with even lengths and '+'longer than 6 letters: ');
    //    for (var i in docs)
    //    {
    //        console.log(JSON.stringify(docs[i]));
    //    }
    //});

});