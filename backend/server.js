const ADMIN = {
    username: "admin",
    password: "1234"
};
const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

let students = [];

try {
    const data = fs.readFileSync("backend/data.json");
    students = JSON.parse(data);
} catch (err) {
    students = [];
}

function saveData() {
    fs.writeFileSync("backend/data.json", JSON.stringify(students, null, 2));
}

app.post("/add-student", (req, res) => {
    const { name, roll, className, session } = req.body;

    const existing = students.find(s => s.roll === roll);
    if (existing) {
        return res.json({ message: "Student already exists" });
    }

    const student = {
        name,
        roll,
        className,
        session,
        attendance: []
    };

    students.push(student);
    saveData();

    res.json({ message: "Student added", student });
});

app.get("/students", (req, res) => {
    res.json(students);
});

app.get("/student/:roll", (req, res) => {
    const roll = parseInt(req.params.roll);

    const student = students.find(s => s.roll === roll);

    if (!student) {
        return res.status(404).json({ message: "Student not found" });
    }

    res.json(student);
});

app.post("/mark-attendance", (req, res) => {
    const { roll, status } = req.body;

    const student = students.find(s => s.roll === roll);

    if (!student) {
        return res.status(404).json({ message: "Student not found" });
    }

    const today = new Date().toISOString().split("T")[0];

    const alreadyMarked = student.attendance.find(a => a.date === today);

    if (alreadyMarked) {
        return res.json({ message: "Already marked today" });
    }

    student.attendance.push({
        date: today,
        status
    });

    saveData();

    res.json({ message: "Attendance marked", student });
});

app.post("/edit-attendance", (req, res) => {
    const { roll, date, status } = req.body;

    const student = students.find(s => s.roll === roll);

    if (!student) {
        return res.status(404).json({ message: "Student not found" });
    }

    const record = student.attendance.find(a => a.date === date);

    if (!record) {
        return res.status(404).json({ message: "No record for this date" });
    }

    record.status = status;

    saveData();

    res.json({ message: "Attendance updated", student });
});

app.post("/undo-attendance", (req, res) => {
    const { roll } = req.body;

    const student = students.find(s => s.roll === roll);

    if (!student) {
        return res.status(404).json({ message: "Student not found" });
    }

    if (student.attendance.length === 0) {
        return res.json({ message: "No attendance to undo" });
    }

    const removed = student.attendance.pop();

    saveData();

    res.json({
        message: "Last attendance removed",
        removed
    });
});

app.get("/student-dashboard/:roll", (req, res) => {
    const roll = parseInt(req.params.roll);

    const student = students.find(s => s.roll === roll);

    if (!student) {
        return res.status(404).json({ message: "Student not found" });
    }

    const total = student.attendance.length;
    const present = student.attendance.filter(a => a.status === "Present").length;
    const percentage = total === 0 ? 0 : (present / total) * 100;

    res.json({
        name: student.name,
        roll: student.roll,
        attendance: student.attendance,
        percentage: percentage.toFixed(2) + "%"
    });
});

app.get("/attendance/:roll", (req, res) => {
    const roll = parseInt(req.params.roll);

    const student = students.find(s => s.roll === roll);

    if (!student) {
        return res.status(404).json({ message: "Student not found" });
    }

    const total = student.attendance.length;
    const present = student.attendance.filter(a => a.status === "Present").length;

    const percentage = total === 0 ? 0 : (present / total) * 100;

    res.json({
        name: student.name,
        roll: student.roll,
        attendance: student.attendance,
        percentage: percentage.toFixed(2) + "%"
    });
});

app.post("/login", (req, res) => {
    const { role, username, password, roll } = req.body;

   if (role === "admin") {
    if (username === ADMIN.username && password === ADMIN.password) {
        return res.json({ success: true, role: "admin" });
    } else {
        return res.json({ success: false, message: "Invalid admin credentials" });
    }
}

    if (role === "student") {
        const student = students.find(s => s.roll === roll);

        if (!student) {
            return res.json({ success: false, message: "Student not found" });
        }

        return res.json({ success: true, role: "student", roll });
    }

    res.json({ success: false, message: "Invalid role" });
});

let logs = [];

app.post("/log", (req, res) => {
    logs.push(req.body.message);
    res.json({ message: "Logged" });
});

app.get("/logs", (req, res) => {
    res.json(logs);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
