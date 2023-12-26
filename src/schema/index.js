
const path = require("path");
const TJS = require("typescript-json-schema")
const fs = require("fs");
// optionally pass argument to schema generator
const settings = {
    required: true,
};

// optionally pass ts compiler options
const compilerOptions = {
    strictNullChecks: true,
};


const program = TJS.getProgramFromFiles(
    [path.resolve("type.ts")],
    compilerOptions,
);

// We can either get the schema for one file and one type...
const schema = TJS.generateSchema(program, "Rule", settings);

fs.writeFile(path.resolve("rule.json"), JSON.stringify(schema, null, 2), 'utf-8', (err) => {
    if (err) {
        console.error('Error writing file:', err);
    } else {
        console.log('File written successfully!');
    }
})



fs.writeFile(path.resolve("group.json"), JSON.stringify(TJS.generateSchema(program, "Group", TJS.getProgramFromFiles(
    [path.resolve("type.ts")],
    compilerOptions,
)), null, 2), 'utf-8', (err) => {
    if (err) {
        console.error('Error writing file:', err);
    } else {
        console.log('File written successfully!');
    }
})

// ... or a generator that lets us incrementally get more schemas

// const generator = TJS.buildGenerator(program, settings);

// // generator can be also reused to speed up generating the schema if usecase allows:
// const schemaWithReusedGenerator = TJS.generateSchema(program, "MyType", settings, [], generator);

// // all symbols
// const symbols = generator.getUserSymbols();

// // Get symbols for different types from generator.
// generator.getSchemaForSymbol("MyType");
// generator.getSchemaForSymbol("AnotherType");