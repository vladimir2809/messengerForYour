var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var usersSchema = new Schema ({
    login:{type: String , index:1, required:true, /*unique:true*/},
    id:{type:Number, index:1, required:true}
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
exports.usersSchema = usersSchema;
console.log('Required Paths: ')
console.log(usersSchema.requiredPaths());
console.log('Indexes: ');
console.log(usersSchema.indexes());
