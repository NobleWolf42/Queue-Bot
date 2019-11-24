var User = function (Name, Message) {
    this.Name = Name;
    this.Message = Message;

    this.DisplayName = function() {
        return this.Name + (this.Message ? " (" + this.Message + ")" : "");
    }
}

module.exports = User;