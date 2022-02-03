const path = require("path");

const moment = require('moment');
const handlebars = require('handlebars');
const yaml = require("js-yaml");
const sass = require("sass");

module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("files");
  eleventyConfig.addPassthroughCopy("style/*.css");

  eleventyConfig.addHandlebarsHelper(
    "traverse",
    function (object, options) {
      let key = options.hash["children"];
      if (object) {
        let rendered = "";
        let queue = object instanceof Array ? object.slice() : [object];

        while (queue.length) {
          let next = queue.shift();
          rendered += options.fn(next);

          if (next[key] instanceof Array) {
            queue = next[key].concat(queue);
          }
        }

        return rendered;
      }
    }
  );

  eleventyConfig.addHandlebarsHelper(
    "if-any",
    function () {
      let conditions = Array.from(arguments).slice(0, -1);
      let options = arguments[arguments.length - 1];
      let value = conditions.filter(v => v)[0];
      if (value) {
        return options.fn({ ...this, value });
      } else if (options.inverse) {
        return options.inverse();
      }
    }
  );

  eleventyConfig.addHandlebarsHelper(
    "if-equal",
    function(input, options) {
      let val = options.hash["value"];
      if (input == val) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    }
  );

  eleventyConfig.addHandlebarsHelper(
    "if-not-equal",
    function(input, options) {
      let val = options.hash["value"];
      if (input != val) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    }
  );

  eleventyConfig.addHandlebarsHelper(
    "$coalesce",
    function () {
      let ary = Array.from(arguments).slice(0, -1);
      if (ary instanceof Array) {
        for (let item of ary) {
          if (item) {
            return item;
          }
        }

        return undefined;
      } else {
        return ary;
      }
    }
  );

  eleventyConfig.addHandlebarsHelper(
    "$lower",
    function (str, options) {
      if (typeof str === "string") {
        return str.toLocaleLowerCase();
      }
    }
  );

  eleventyConfig.addHandlebarsHelper(
    "$upper",
    function (str, options) {
      if (typeof str === "string") {
        return str.toLocaleUpperCase();
      }
    }
  );

  eleventyConfig.addHandlebarsHelper(
    "$strip",
    function (str, chars) {
      if (str && chars) {
        let charArray = Array.from(chars);
        let result = '';
        for (let i = 0; i < str.length; i++) {
          if (!charArray.includes(str[i])) {
            result += str[i];
          }
        }
        return result;
      } else {
        return str;
      }
    }
  );

  eleventyConfig.addHandlebarsHelper(
    "$formatDate",
    function (str, format) {
      if (str && format) {
        return moment(str).format(format);
      } else {
        return str;
      }
    }
  );

  eleventyConfig.addHandlebarsHelper(
    "$abbr",
    function (obj, className) {
      if (obj && obj.abbreviation) {
        let classAttr =
          typeof className === "string" ?
            ` class="${className}"` :
            '';
        return new handlebars.SafeString(
          `<abbr title="${obj.text}"${classAttr}>${obj.abbreviation}</abbr>`
        )
      } else {
        return obj;
      }
    }
  );

  eleventyConfig.addHandlebarsHelper(
    "$log",
    function (value) {
      console.log((typeof value) + (value && value.prototype ? ': ' + value.prototype.constructor.name : ''));
      console.log(value);
      return value;
    }
  );

  eleventyConfig.setFrontMatterParsingOptions({
    delimiters: ['/*---', '---*/']
  });

  eleventyConfig.setDynamicPermalinks(false);

  eleventyConfig.addDataExtension("yml", contents => yaml.load(contents));

  eleventyConfig.addTemplateFormats("scss");

  // Creates the extension for use
  eleventyConfig.addExtension("scss", {
    outputFileExtension: "css", // optional, default: "html"

    // `compile` is called once per .scss file in the input directory
    compile: function(inputContent, inputPath) {
      let parsed = path.parse(inputPath);

      let result = sass.compileString(inputContent, {
        loadPaths: [
          parsed.dir || ".",
          this.config.dir.includes
        ]
      });

      return (data) => {
        return result.css;
      };
    }
  });
};
