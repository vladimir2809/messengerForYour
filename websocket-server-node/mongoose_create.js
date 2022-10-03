var mongoose = require('mongoose');
var db = mongoose.connect('mongodb://localhost/words');
var wordSchema = require('./schemaMongoose.js').wordSchema;
var Words = mongoose.model('Words',wordSchema);
mongoose.connection.once('open', function () {
    var newWord1 = new Words({
        word: 'gratification',
        first: 'g', last: 'n', size: 12,
        letters: [ 'g', 'r', 'a', 't', 'i', 'f', 'c', 'o', 'o',] ,
        stats: { vowels: 5, consonants: 7 },
    });
    console.log('Is Document new?' + newWord1.isNew+ newWord1);
    newWord1.save(function (err, doc) {
        console.log("\nSaved document: " + doc+'\n'+err);

    });
    var newWord2 = {
        word: 'googled',
        first: 'g', last: 'd', size: 7,
        letters: [ 'g', 'o', 'l', 'e', 'd'],
        stats: { vowels: 3, consonats: 4 },
    };
    var newWord3 = {
        word: 'selfie',
        first: 's', last: 'e', size: 6,
        letters: [ 's', 'e', 'l', 'f', 'i' ],
        stats: { vowels: 3, consonats: 3 },
    };
    Words.create([newWord2, newWord3], function (err) {
        for (var i = 1; i < arguments.length; i++) {
            console.log("\nCreated docunent: " + arguments[i]);
        }
        mongoose.disconnect();
    });
    
});