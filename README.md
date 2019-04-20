# Modifiable LSystems

Clemen Deng (PennKey: clemen)

![](main.png)

This project is based on [this paper](https://www.graphics.rwth-aachen.de/media/papers/krecklau_generalized_grammar_071.pdf) on generalized grammar systems.

[WebGL link](https://clemendeng.github.io/hw04-l-systems/)

## Overview

Setup: I combined my hw4 code and my city generation code into a generalized lsystem, that includes a turtle that can move in three dimensions and supports loading objs as primitives to instance render.

## User Friendly Lsystem

This is the goal for my project. The interface would have the current lsystem displayed, and also have a menu on the right displaying all of the rules. The menu would display any children rules as well. So for example, if our plant is 'P', which expands into 'SLSLS' (stems and leaves), the stems and leaves would be children of 'P'. This would be displayed in the gui in some hierarchical manner. All of these rules (plants, stems, leaves) would have attributes similar to the box attributes talked about above. The user would then be allowed to go in and modify attributes of the elements: length of the plant, length of the stems, shape of the leaves, etc. They could also add primitives in.

The user could also add in additional elements. They would modify the attributes of the turtle, create primitives, and essentially model in real time. The element they model would be displayed separately from the main lsystem. For example, they could model 'B', a berry, by combining a few spheres. Then they could incorporate the modeled primitives into the lsystem.

## Current Implementation

Right now I have the Lsystem elements displayed in the GUI. All expansion elements and function elements are displayed, and expansion elements are displayed as folders with the elements they expand into in the folder. The parameters of each element are also displayed, and the user can go in a modify the parameters of specific elements. Once they do this, the lsystem will reload with the modified parameters. Note that modifying parameters in a certain iteration will reset all modified parameters in following iterations. 

## Next Steps

Going forward, I want to make it so that the resetting mentioned above only resets children of the expansion rule being modified. Additional features I will implement include: allowing the user to add and delete elements from the lsystem, allowing the user to model and create their own expansion elements, and having a visually appealing initial lsystem.