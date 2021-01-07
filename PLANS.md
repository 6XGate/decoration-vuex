- Watcher improvements:
    - Create watcher tests. [ [#4](https://github.com/6XGate/decoration-vuex/issues/4) ]
    - Test the limits of what watchers may do and select or create an appropriate type of proxy.
    - Add a module `$watch` method for dynamically attached watchers.
    - Add support for using a getter method rather than a path for watchers.
- Local function improvements:
    - Allow public use of local functions, or provide a public equivalent.
- General improvements:
    - Minify production builds. [ [#6](https://github.com/6XGate/decoration-vuex/issues/6) ]
    - Add support for sub-module references.
    - Support, or block, inheriting classes already decorated with `@Module`.
    - Support manual Vuex invocation and mapper functions [
      [#8](https://github.com/6XGate/decoration-vuex/issues/8) ].
    - Maybe, support open-state access on objects and arrays of a module.
- Project improvements:
    - Add support for continuous integration, code coverage, linting, and testing status indicators. [
      [#2](https://github.com/6XGate/decoration-vuex/issues/2),
      [#3](https://github.com/6XGate/decoration-vuex/issues/3) ]
    - Add support for UMD and/or IIFE modules, which will require. [
      [#5](https://github.com/6XGate/decoration-vuex/issues/5) ]
    - Add additional features like those in
      [Arnav Gupta's Vuex Class Decorators](https://github.com/championswimmer/vuex-module-decorators).
