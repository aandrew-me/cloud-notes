require('dotenv').config()
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
var shajs = require("sha.js");

///////////////////////
//    Database start
///////////////////////
mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGODB_URL);

const userSchema = new mongoose.Schema({
	username: { type: String, required: true },
	password: { type: String, required: true },
	notes: Array,
});

const User = new mongoose.model("user", userSchema);

///////////////////////
//    Database end
///////////////////////

//////////////////////
// Server listening
//////////////////////

const PORT = process.env.PORT || 4567

app.listen(PORT, () => {
	console.log("Server: http://localhost:" + PORT);
});

//////////////////////

//////////////////////
//   Root route
//////////////////////

app.get("/", (req, res) => {
	res.render("index");
});

////////////////////////
//       Login
////////////////////////

app.get("/login", (req, res) => {
	// If cookies are there
	if (req.cookies.id) {
		// Decoding id from base64
		const decodedId = Buffer.from(req.cookies.id, "base64").toString(
			"utf-8"
		);
		const username = decodedId.split("&")[0];
		let password = decodedId.split("&")[1];

		if (username && password) {
			// Hashing password
			password = shajs("sha512").update(password).digest("hex");

			// Looking for the username
			User.findOne({ username: username }, (err, foundUser) => {
				// If the username is found
				if (foundUser) {
					if (foundUser.password === password) {
						res.render("personal", {
							username:
								username[0].toUpperCase() +
								username.slice(1).toLowerCase(),
							notes: foundUser.notes,
						});
					} else {
						res.render("login", {
							message: "",
						});
					}
				} else {
					res.render("login", { message: "" });
				}
			});
		}
	}
	// If no cookies are there
	else {
		res.render("login", { message: "" });
	}
});

app.post("/login", (req, res) => {
	// If both username and password are present
	if (req.body.username && req.body.password) {
		const username = req.body.username;

		// Hasing password
		const password = shajs("sha512")
			.update(req.body.password)
			.digest("hex");

		// Looking for the username
		User.findOne({ username: username }, (err, foundUser) => {
			// If the username is found
			if (foundUser) {
				if (foundUser.password === password) {
					const id = `${username}&${req.body.password}`;
					const encodedId = Buffer.from(id).toString("base64");
					// Sending cookie
					res.cookie("id", encodedId, {
						maxAge: 2.592e9,
						secure:true,
						httpOnly:true,
						sameSite:"strict"
					});
					res.render("personal", {
						username:
							username[0].toUpperCase() +
							username.slice(1).toLowerCase(),
						notes: foundUser.notes,
					});
				} else {
					res.render("login", { message: "Password is incorrect" });
				}
			}
			// If username is unused
			else {
				res.render("login", {
					message:
						"The following user does not exist. Create a new account instead",
				});
			}
		});
	} else {
		res.render("login", {
			message: "Provide a proper username and password",
		});
	}
});

////////////////////////
//       Signup
////////////////////////

app.get("/signup", (req, res) => {
	res.render("signup", { message: "" });
});

app.post("/signup", (req, res) => {
	if (req.body.username && req.body.password) {
		//! I WILL NOT ACCEPT AMBIGUOUS CHARACTERS
		if (
			req.body.username.includes("&") ||
			req.body.password.includes("&")
		) {
			res.render("signup", {
				message: "Only Alphabets and Numbers are allowed.",
			});
		} else {
			const username = req.body.username;
			const password = shajs("sha512")
				.update(req.body.password)
				.digest("hex");

			User.findOne({ username: username }, (err, userFound) => {
				if (userFound) {
					res.render("signup", {
						message:
							"The username already exists. Use a different one",
					});
				} else {
					const newUser = new User({
						username: username,
						password: password,
					});
					newUser.save();

					const id = `${username}&${req.body.password}`;
					const encodedId = Buffer.from(id).toString("base64");

					// Sending cookie
					res.cookie("id", encodedId, {
						maxAge: 2.592e9,
						secure:true,
						httpOnly:true,
						sameSite:"strict"
					});
					res.redirect("/login");
				}
			});
		}
	} else {
		res.render("signup", { message: "Please input values properly" });
	}
});

//////////////////////
// Notes
//////////////////////

app.get("/note", (req, res) => {
	// If cookies are there
	if (req.cookies.id) {
		// Decoding id from base64
		const decodedId = Buffer.from(req.cookies.id, "base64").toString(
			"utf-8"
		);
		const username = decodedId.split("&")[0];
		let password = decodedId.split("&")[1];

		if (username && password) {
			// Hashing password
			password = shajs("sha512").update(password).digest("hex");

			// Looking for the username
			User.findOne({ username: username }, (err, foundUser) => {
				// If the username is found
				if (foundUser) {
					if (foundUser.password === password) {
						res.render("note", {
							username:
								username[0].toUpperCase() +
								username.slice(1).toLowerCase(),
							notes: foundUser.notes,
						});
					} else {
						res.render("login", {
							message: "You have to login to add a note.",
						});
					}
				} else {
					res.render("login", {
						message: "You have to login to add a note.",
					});
				}
			});
		}
	}
	// If no cookies are there
	else {
		res.render("login", { message: "You have to login to add a note." });
	}
});

app.post("/fullnote", (req, res)=>{
	const title = req.body.title
	const body = req.body.body

	res.render("fullnote", {title:title, body:body})
})

app.post("/newnote", (req, res) => {
	if (req.body.title && req.body.body) {
		// If cookies are there
		if (req.cookies.id) {
			// Decoding id from base64
			const decodedId = Buffer.from(req.cookies.id, "base64").toString(
				"utf-8"
			);
			const username = decodedId.split("&")[0];
			let password = decodedId.split("&")[1];

			if (username && password) {
				// Hashing password
				password = shajs("sha512").update(password).digest("hex");

				// Looking for the username
				User.findOne({ username: username }, (err, foundUser) => {
					// If the username is found
					if (foundUser) {
						if (foundUser.password === password) {
							const noteCount = foundUser.noteCount;
							const noteObject = {
								id: Math.random().toString("16").slice(2),
								title: req.body.title,
								body: req.body.body,
							};
							foundUser.notes.push(noteObject);
							foundUser.save();
							res.redirect("/login");
						} else {
							res.render("login", {
								message: "You have to login to add a note.",
							});
						}
					}
					// If no username is found
					else {
						res.render("login", {
							message: "You have to login to add a note.",
						});
					}
				});
			}
		}
		// If no cookies are there
		else {
			res.render("login", {
				message: "You have to login to add a note.",
			});
		}
	}
});

app.post("/deletenote", (req, res) => {
	// If note has an Id
	if (req.body.id) {
		const noteId = req.body.id;
		// If cookies are there
		if (req.cookies.id) {
			// Decoding id from base64
			const decodedId = Buffer.from(req.cookies.id, "base64").toString(
				"utf-8"
			);
			const username = decodedId.split("&")[0];
			let password = decodedId.split("&")[1];

			if (username && password) {
				// Hashing password
				password = shajs("sha512").update(password).digest("hex");

				// Looking for the username
				User.findOne({ username: username }, (err, foundUser) => {
					// If the username is found
					if (foundUser) {
						if (foundUser.password === password) {
							let finalNoteList = [];
							foundUser.notes.forEach((note) => {
								if (note.id != noteId) {
									finalNoteList.push(note);
								}
							});
							foundUser.notes = finalNoteList;
							foundUser.save();
							res.json({ remove: true });
						} else {
							res.json({ remove: false });
						}
					}
					// If no username is found
					else {
						res.json({ remove: false });
					}
				});
			}
		}
		// If no cookies are there
		else {
			res.json({ remove: false });
		}
	}
});

////////////////////
// Logout
////////////////////

app.get("/logout", (req, res) => {
	res.clearCookie("id");
	res.redirect("/");
});
