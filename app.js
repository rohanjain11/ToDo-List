const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");
const { Schema } = mongoose;

const app = express();

app.set("view engine", "ejs");

app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));

mongoose.connect("mongodb://127.0.0.1:27017/toDoListDB", {
  useNewUrlParser: true,
});

const itemsSchema = {
  name: String,
};

const Item = new mongoose.model("Item", itemsSchema);
const item1 = new Item({
  name: "Welcome to your ToDo List!",
});
const item2 = new Item({
  name: "Hit the + button to add new item.",
});
const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

// const workItems = [];

app.get("/", function (req, res) {
  Item.find({})

    .then(function (foundItems) {
      if (foundItems.length == 0) {
        Item.insertMany(defaultItems)
          .then(function () {
            console.log("Successfully saved default items to DB");
          })
          .catch(function (err) {
            console.log(err);
          });
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });

  if (listName == "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName })
      .then((foundList) => {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      })
      .catch((err) => console.log(err.body));
  }
});

app.post("/delete", function (req, res) {
  const listName = req.body.listName;
  const checkItemId = req.body.checkbox;

  if (listName == "Today") {
    deleteCheckedItem();
  } else {
    deleteCustomItem();
  }

  async function deleteCheckedItem() {
    await Item.deleteOne({ _id: checkItemId });
    res.redirect("/");
  }

  async function deleteCustomItem() {
    await List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkItemId } } }
    );
    res.redirect("/" + listName);
  }
});

app.get("/:customNameList", function (req, res) {
  const customNameList = _.capitalize(req.params.customNameList);
  List.findOne({ name: customNameList })
    .then((foundList) => {
      if (foundList) {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      } else {
        const list = new List({
          name: customNameList,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customNameList);
      }
    })
    .catch((err) => console.log(err.body));
});


app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000 || process.env.PORT, ()=>{
    console.log(`The application started successfully on port`);
});
