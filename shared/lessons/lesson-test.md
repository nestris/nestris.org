Avoid the longbar dependency

PAGE text

Welcome back! This lesson focuses on building stacks that minimize longbar dependencies, which have a huge risk of compromising your stack. If you feel like your stacks suddenly spawn multiple longbar dependencies out of nowhere, this is the lesson for you. Let’s dive right in!

PAGE puzzle

# Take the burn if you need to!

$BOARD=iqCpVQVSUpKqqUkqlKy+rSUkpJVFUpKSlA==
$SCORE=762460
$LEVEL=20
$LINES=142
$CURRENT=O
$NEXT=J

Tetris is a game of randomness. This means that you can never rely on getting a particular piece when you stack! In this board, you might feel that O-34 makes sense, being the only move that doesn’t seem to create a hole.

But it creates something worse - a longbar dependency! Only a longbar fits column 5, and if we don’t get it our stack is bound to fall into shambles!

Can you find a different move that doesn’t create a hole, yet avoids creating a longbar dependency?

@MOVE O-90=CORRECT
Excellent move! Although scoring Tetrises are ideal, don’t hesitate to make lesser line-clears  if it avoids creating a longbar dependency!

Feel to explore other square placements and receive feedback. When you’re ready, click “Next”!
@MOVE O-34,O-67=INCORRECT
Not quite! This creates a longbar dependency at column 5, which is exactly what we're trying to avoid in this lesson.

@MOVE default=INCORRECT
This move creates a hole. Try again!

PAGE puzzle-continuation
// this is a comment. we continue the previous puzzle after the correct move has been placed
$NEXT=T

Let's finish out this problem by placing the J piece!

@MOVE J-123=CORRECT
Great job! You finished the puzzle!

@MOVE default=INCORRECT
Try again!