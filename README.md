# adapt-contrib-randomise

An extension to randomise the children of the model to which it is attached.

Most commonly used with an [assessment](https://github.com/adaptlearning/adapt-contrib-scoringAssessment) to pluck a defined number of questions and/or randomise the question order, but could also be used to display different content within a page for each visit. Outside of an assessment, consideration should be made regarding the user journey and completion requirements for any content which is randomised.

If the config or associated child models are changed in a way which affects randomisation, the parent model is reset as the content will be refreshed and needs to be retaken.

## Attributes

The attributes listed below can be used in *articles.json* and *blocks.json*, and are properly formatted as JSON in [*example.json*](https://github.com/adaptlearning/adapt-contrib-randomise/blob/master/example.json).

**\_isEnabled** (boolean): Determines whether this model should randomise the order of it's child models. The default is `false`.

**\_pluckCount** (number): Specifies the number of children to include. Negative counts will remove that number from the total. Set to `0` to display all children. The default is `0`.

**\_shouldRefreshOnRevisit** (boolean): Determines whether the included models are refreshed when a user revisits the page. The default is `false`.

## Limitations

Not compatible with content using [branching](https://github.com/adaptlearning/adapt-contrib-branching) as branching models are dynamically rendered.

`_shouldRefreshOnRevisit` should not be enabled for content using [trickle](https://github.com/adaptlearning/adapt-contrib-trickle) as the execution order can result in the first trickled model being rendered further down the page, preventing scrolling.

Restricted to articles as the parent model due to the use of `_trackingId` (only available for blocks and components) when saving the child models used for restoration across sessions. If not saving state for restoration, randomisation could technically be assigned to other parent-child model relationships.

----------------------------
**Version number:** 1.0.0<br>
**Framework versions:** >=5.28.8<br>
**Author / maintainer:** Adapt Core Team with [contributors](https://github.com/adaptlearning/adapt-contrib-randomise/graphs/contributors)<br>
**Plugin dependenies:** [adapt-contrib-modifiers](https://github.com/adaptlearning/adapt-contrib-modifiers): ">=1.0.0"
