
import express from "express";
import mongoose from "mongoose";
import { User } from "./models/user.js";
import bcrypt from "bcrypt";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");

const databaseConnection = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/myapp");
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Error connecting to database:", error);
  }
};

databaseConnection();

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});


app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.render("signup", {
        error: "All fields are required",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.render("signup", {
        error: "Email is already registered",
      });
    }

    let hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.redirect("/Admin/dashboard");
  } catch (error) {
    console.error("Error creating user:", error);

    res.render("signup", {
      error: "Something went wrong while creating the account",
    });
  }
});


app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render("login", {
        error: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.render("login", {
        error: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.render("login", {
        error: "Invalid email or password",
      });
    }

    // console.log("User logged in:", user.email);

    res.redirect("/Admin/dashboard");
  } catch (error) {
    console.error("Login error:", error);

    res.render("login", {
      error: "Something went wrong during login",
    });
  }
});

app.get("/Admin/dashboard", async (req, res) => {
    const email = req.query.email;
  try {
    const users = await User.find();
    res.render("dashboard", {
      users : users || [],
    });
  } catch (error) {
    console.error(error);
    res.send("Unable to load dashboard");
  }
});

app.get("/Dashboard/:email", async (req, res) => {
  try {
    const email = req.params.email;

    const user = await User.findOne({ email });

    if (!user) {
      return res.send("User not found");
    }

    // console.log("User details:", user);

    res.render("userdetail", {
      user,
    });
  } catch (error) {
    console.error( error);

    res.send("Unable to load user details");
  }
});

app.post("/users/:email/delete", async (req, res) => {
  try {
    const email = req.params.email;

    const deletedUser = await User.deleteOne({
      email,
    });

    if (!deletedUser) {
      return res.send("User not found");
    }
    // console.log("User deleted:", email);

    res.redirect("/Admin/dashboard");
  } catch (error) {
    console.error( error);
  }
});




app.get("/users/:email/edit", async (req, res) => {
  try {
    const email = req.params.email;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send("User not found");
    }

    res.render("edituser", {
      user
    });

  } catch (error) {
    console.error("Edit page error:", error);

    res.send("Unable to load edit page");
  }
});


app.post("/users/:email/edit", async (req, res) => {
  try {
    const oldEmail = req.params.email;

    const {
      name,
      email,
      password
    } = req.body;


    const user = await User.findOne({
      email: oldEmail
    });

    if (!user) {
      return res.send("User not found");
    }


    if (email !== oldEmail) {

      const existingUser = await User.findOne({
        email
      });

      if (existingUser) {
        return res.render("edituser", {
          user,
          error: "This email is already registered."
        });
      }
    }

    user.name = name;
    user.email = email;
    if (password && password.trim() !== "") {

      const hashedPassword = await bcrypt.hash(
        password,
        10
      );

      user.password = hashedPassword;
    }

    await user.save();

    // console.log("User updated:", user.email);


    // Redirect to updated user details

    res.render("userdetail", {
      user,
    //   success: "User updated successfully"
    });
  } catch (error) {

    console.error("Update user error:", error);

    res.send(
      "Unable to update user"
    );
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
