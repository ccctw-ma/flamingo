const configObject = {
    flamingo: "flamingo",
};

const CONFIG = new Proxy(configObject, {
    get(target, property) {

        console.log(target, property)
        return target[property];
    },

    set(target, property, value) {
       target[property] = value;
        return true;
    },
});

CONFIG.flamingo = "spheniscus";

console.log(CONFIG.flamingo);

CONFIG.flamingo