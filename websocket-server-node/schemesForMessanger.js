var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var usersSchema = new Schema ({
    login:{type: String , index:1, required:true, /*unique:true*/},
    contactArr:[{loginHost:String}],
    //first:{type: String, index:1},
    //last:String,
    //size:Number,
    //letters: [String],
    //stats:{vowels: Number, consonants: Number,},
    //charsets: [Schema.Types.Mixed]

    },{ collection: 'users',autoIndex:true });
//wordSchema.methods.StartWith = function (letter) {
//    return this.first === letter;
//};
var messagesSchema = new Schema ({
    login1:{type: String , index:1, required:true, /*unique:true*/},
    login2:{type: String , index:1, required:true, /*unique:true*/},
    messageArr:[ {loginSender:String,loginHost:String,message:String,time:Number} ],
    //first:{type: String, index:1},
    //last:String,
    //size:Number,
    //letters: [String],
    //stats:{vowels: Number, consonants: Number,},
    //charsets: [Schema.Types.Mixed]

    },{ collection: 'messages',autoIndex:true });
//wordSchema.methods.StartWith = function (letter) {
//    return this.first === letter;
//};    messagesSchema
exports.messagesSchema = messagesSchema;
exports.usersSchema = usersSchema;
console.log('Required Paths: ')
console.log(usersSchema.requiredPaths());
console.log('Indexes: ');
console.log(usersSchema.indexes());

console.log('Required Paths: ')
console.log(messagesSchema.requiredPaths());
console.log('Indexes: ');
console.log(messagesSchema.indexes());
