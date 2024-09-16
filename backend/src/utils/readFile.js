import fs from "fs";

const usersFilePath = path.join(__dirname, "../users.json");

export const readFile = () => {
    const data = fs.readFileSync(usersFilePath);
    return data;
}