# How To Contribute

## Submit an Issue

If you are not sure how to get started with contributing, or have an issue, start by opening an [Issue](https://github.com/barrel/barrel-cli/issues).

Provide enough details that will help the issue get visibility. 

- **What is the main issue?**
- **How will this help the project?**
- **How did you run into and replicate the issue?**
- **What systems did you run the application?**

## Submit a Merge Request

Feel free to fork the repo and submit merge requests for existing issues and reference the issue in the Merge Request message. A reviewer will respond to the merge request with any requirements.

## Publishing

We use `npm` to maintain this package. The general steps to publish will only work for users added directly to our organization.

1. After the merge is successful from a given feature, bump the versions with `npm version $INC`
2. Publish the new version to npm with `npm publish` (pre-req `npm login`)
