const authRoutes = require("./routes/authRoutes");
console.log("Auth Routes:", authRoutes);
if (authRoutes && authRoutes.stack) {
    console.log("Stack length:", authRoutes.stack.length);
    authRoutes.stack.forEach((layer, index) => {
        if (layer.route) {
            console.log(`Layer ${index}: path=${layer.route.path} methods=${JSON.stringify(layer.route.methods)}`);
        } else {
            console.log(`Layer ${index}: no route info (maybe middleware)`);
        }
    });
} else {
    console.log("Not a router or empty stack");
}
