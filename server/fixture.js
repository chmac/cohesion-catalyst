// Fixture data
if (Trainings.find().count() === 0) {
  var today, tomorrow;
  today = new Date();
  tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  Trainings.insert({
    title: "Training Daimler",
    description: "Team building master class.",
    startDate: today,
    endDate: tomorrow
  });

  Trainings.insert({
    title: "Training ESMT",
    description: "Team building master class.",
    startDate: new Date(today.getTime() + 2 * 24 * 3600 * 1000),
    endDate: new Date(tomorrow.getTime() + 2 * 24 * 3600 * 1000)
  });
}

if (Avatars.find().count() === 0) {
  Avatars.insert({
    type: "#smiley-wink",
    url: "/svg/avatars.svg#smiley-wink",
    xPos: 0,
    yPos: 0
  });

  Avatars.insert({
    type: "#smiley-chuckle",
    url: "/svg/avatars.svg#smiley-chuckle",
    xPos: 200,
    yPos: 0
  });

  Avatars.insert({
    type: "#smiley-smirk",
    url: "/svg/avatars.svg#smiley-smirk",
    xPos: 400,
    yPos: 0
  });

  Avatars.insert({
    type: "#smiley-lol",
    url: "/svg/avatars.svg#smiley-lol",
    xPos: 0,
    yPos: 200
  });

  Avatars.insert({
    type: "#smiley-smile",
    url: "/svg/avatars.svg#smiley-smile",
    xPos: 200,
    yPos: 200
  });

  Avatars.insert({
    type: "#smiley-nerd",
    url: "/svg/avatars.svg#smiley-nerd",
    xPos: 400,
    yPos: 200
  });

  Avatars.insert({
    type: "#smiley-star",
    url: "/svg/avatars.svg#smiley-star",
    xPos: 0,
    yPos: 400
  });

  Avatars.insert({
    type: "#smiley-heart",
    url: "/svg/avatars.svg#smiley-heart",
    xPos: 200,
    yPos: 400
  });

  Avatars.insert({
    type: "#smiley-cool",
    url: "/svg/avatars.svg#smiley-cool",
    xPos: 400,
    yPos: 400
  });
}
