import fs from "fs";

const usersFilePath = path.join(__dirname, "../users.json");

export const writeFile = (user) => {
    const registeredUser = fs.writeFileSync(usersFilePath, JSON.stringify(user));
    return registeredUser;
}