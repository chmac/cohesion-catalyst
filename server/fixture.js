// Fixture data
if (Trainings.find().count() === 0) {
  Trainings.insert({
    title: "Training Session X",
    description: "Team building master class."
  });
}

if (Avatars.find().count() === 0) {
  Avatars.insert({
    type: "Winking",
    url: "/svg/avatars.svg#smiley-wink",
    xPos: 0,
    yPos: 0
  });

  Avatars.insert({
    type: "Chuckling",
    url: "/svg/avatars.svg#smiley-chuckle",
    xPos: 200,
    yPos: 0
  });

  Avatars.insert({
    type: "Smirking",
    url: "/svg/avatars.svg#smiley-smirk",
    xPos: 400,
    yPos: 0
  });

  Avatars.insert({
    type: "LOL",
    url: "/svg/avatars.svg#smiley-lol",
    xPos: 0,
    yPos: 200
  });

  Avatars.insert({
    type: "Smiling",
    url: "/svg/avatars.svg#smiley-smile",
    xPos: 200,
    yPos: 200
  });

  Avatars.insert({
    type: "Nerd",
    url: "/svg/avatars.svg#smiley-nerd",
    xPos: 400,
    yPos: 200
  });

  Avatars.insert({
    type: "Star",
    url: "/svg/avatars.svg#smiley-star",
    xPos: 0,
    yPos: 400
  });

  Avatars.insert({
    type: "Heart",
    url: "/svg/avatars.svg#smiley-heart",
    xPos: 200,
    yPos: 400
  });

  Avatars.insert({
    type: "Cool",
    url: "/svg/avatars.svg#smiley-cool",
    xPos: 400,
    yPos: 400
  });
}
