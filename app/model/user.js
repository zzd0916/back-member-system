module.exports = app => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const UserSchema = new Schema({
        _id: { type: String },
        phone: { type: String },
        name: { type: String },
        sex: { type: String },
        birthday: { type: String },
        age: { type: Number, default: 18},
        adderes: { type: String, default: "" },
        shop: { type: String },
        createTime: { type: Date, default: Date.now },
        idCard:{type: String}
    });

    return mongoose.model('User', UserSchema, 'user');
}
