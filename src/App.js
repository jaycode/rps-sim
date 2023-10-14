import React, { useEffect, useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Offcanvas from 'react-bootstrap/Offcanvas';

// Member class with x, y coordinates and belonging faction
class Member {
  constructor(x, y, faction) {
    this.x = x;
    this.y = y;
    this.faction = faction;
  }

  // Chase a target Member
  chase(target) {
    // Calculate distance to the target
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Start with the original speed
    let dynamicSpeed = this.faction.speed;

    // Check if the target is within the view range
    if (distance <= this.faction.viewRange) {
      // Calculate the speed increment based on the logarithmic function
      const speedIncrement = Math.log(this.faction.viewRange / Math.max(1, distance));
      // Apply speed increment to original speed
      dynamicSpeed += speedIncrement;
    }

    // Ensure the speed does not exceed maxSpeed
    dynamicSpeed = Math.min(dynamicSpeed, this.faction.maxSpeed);

    if (distance < 5) {  // "Touch" threshold
      this.faction.addMember(target);
      target.faction.removeMember(target);
      target.faction = this.faction;
    }

    // Move towards the target
    this.x += (dx / distance) * dynamicSpeed;
    this.y += (dy / distance) * dynamicSpeed;
  }

  // Calculate distance to a target Member
  distanceTo(target) {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

// Faction class holding its members
class Faction {
  constructor(speed, maxSpeed, viewRange, color, numMembers, imageOrEmoji) {
    // Initialize properties
    this.speed = speed;
    this.maxSpeed = maxSpeed;
    this.viewRange = viewRange;
    this.color = color;
    this.imageOrEmoji = imageOrEmoji || null;

    // Create initial members
    this.members = Array.from({ length: numMembers }, () => (
      new Member(Math.random() * window.innerWidth, Math.random() * window.innerHeight, this)
    ));
    this.lastChased = null;
  }

  // Chase members of another faction
  chaseFaction(targetFaction, allFactions, isLastOneStandingMode) {
    this.members.forEach((member) => {
      // Determine next target faction, by also considering the Last One Standing Mode mode.
      let nextFaction = targetFaction;

      if (isLastOneStandingMode && targetFaction.members.length === 0 && this.lastChased !== targetFaction) {
        const targetIndex = allFactions.indexOf(targetFaction);
        for (let i = 1; i < allFactions.length; i++) {
          const nextIndex = (targetIndex + i) % allFactions.length;
          if (allFactions[nextIndex].members.length > 0 && allFactions[nextIndex] !== this) {
            nextFaction = allFactions[nextIndex];
            this.lastChased = nextFaction;
            break;
          }
        }
      }

      // Skip empty or same factions
      if (nextFaction.members.length === 0 || nextFaction === this) {
        return;
      }

      // Find the closest target member
      let closestTarget = nextFaction.members[0];
      let minDistance = member.distanceTo(closestTarget);

      nextFaction.members.forEach(target => {
        const distance = member.distanceTo(target);
        if (distance < minDistance) {
          minDistance = distance;
          closestTarget = target;
        }
      });

      // Chase the closest target member
      if (closestTarget) {
        member.chase(closestTarget);
      }
    });
  }

  addMember(member) {
    this.members.push(member);
  }

  removeMember(member) {
    const index = this.members.indexOf(member);
    if (index > -1) {
      this.members.splice(index, 1);
    }
  }
}

const App = () => {
  // State variables
  const [numFactions, setNumFactions] = useState(3);
  const [numMembers, setNumMembers] = useState(30);
  const [factions, setFactions] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [tick, setTick] = useState(0);
  const [factionImagesOrEmojis, setFactionImagesOrEmojis] = useState(Array(numFactions).fill(null));
  const [isLastOneStandingMode, setIsLastOneStandingMode] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [maxSpeed, setMaxSpeed] = useState(3);
  const [viewRange, setViewRange] = useState(300);
  const [size, setSize] = useState(20);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [show, setShow] = useState(false);
  const [triggerSidebar, setTriggerSidebar] = useState(false);

  // Initialize factions
  const initializeFactions = () => {
    const initialFactions = Array.from({ length: numFactions }, (_, i) => {
      const imageOrEmoji = factionImagesOrEmojis[i] || getEmojiByFactionIndex(i);
      return new Faction(
        speed,
        maxSpeed,
        viewRange,
        `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`,
        numMembers,
        imageOrEmoji);
    });
    setFactions(initialFactions);
  };

  // Update logic
  useEffect(() => {
    initializeFactions();
  }, [numFactions, numMembers]);

  useEffect(() => {
    let interval;

    if (isPaused === "pauseAndShowSidebar") {
      setShow((s) => !s);
    }

    if (!isPaused) {
      interval = setInterval(() => {
        factions.forEach((faction, i) => {
          const nextFaction = factions[(i + 1) % factions.length];
          faction.chaseFaction(nextFaction, factions, isLastOneStandingMode);
        });

        setTick(prevTick => prevTick + 1);
      }, 16);
    }

    return () => clearInterval(interval);
  }, [isPaused, factions, isLastOneStandingMode, triggerSidebar]);

  // Set default emoji for the first three factions.
  const getEmojiByFactionIndex = (index) => {
    switch (index) {
      case 0: return '🪨'; // Rock
      case 1: return '✂️'; // Scissors
      case 2: return '📋'; // Paper
      default: return ''; // Default to no emoji for other factions
    }
  };

  const renderMember = (faction, factionIndex, member, i) => {
    return (
      <div
        key={`${factionIndex}-${i}`}
        style={{
          position: 'absolute',
          top: `${member.y}px`,
          left: `${member.x}px`,
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: faction.imageOrEmoji ? 'transparent' : faction.color,
          fontSize: `${size}px`,
          textAlign: 'center',
          lineHeight: `${size}px`,
        }}
      >
        {faction.imageOrEmoji && faction.imageOrEmoji.startsWith('data:image/') ?
          <img src={faction.imageOrEmoji} alt="" style={{width: '100%', height: '100%'}} />
          : faction.imageOrEmoji || null}
      </div>
    );
  };

  function Sidebar() {
    const handleClose = () => setShow(false);
    return (
      <>
        <Offcanvas show={show} onHide={handleClose} scroll={true} backdrop={true}>
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>Options</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <Form>
              <label>
                Number of Factions:
                <input type="number" value={numFactions} onChange={e => setNumFactions(Number(e.target.value))} />
              </label>
              <label>
                Members per Faction:
                <input type="number" value={numMembers} onChange={e => setNumMembers(Number(e.target.value))} />
              </label>
              <label>
                Speed:
                <input type="number" value={speed} onChange={e => setSpeed(Number(e.target.value))} />
              </label>
              <label>
                Max Speed:
                <input
                  type="number"
                  value={maxSpeed}
                  onChange={e => setMaxSpeed(Number(e.target.value))} />
              </label>

              <label>
                View Range:
                <input
                  type="number"
                  value={viewRange}
                  onChange={e => setViewRange(Number(e.target.value))} />
              </label>
              {Array.from({ length: numFactions }).map((_, i) => (
                <div key={i}>
                  <label>
                    Faction {i + 1} Image:
                    <input type="file" onChange={(e) => {
                      const file = e.target.files[0];
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const newImagesOrEmojis = [...factionImagesOrEmojis];
                        newImagesOrEmojis[i] = reader.result;
                        setFactionImagesOrEmojis(newImagesOrEmojis);
                      };
                      reader.readAsDataURL(file);
                    }} />
                  </label>
                  <label>
                    or Emoji:
                    <input type="text" onChange={(e) => {
                      const newImagesOrEmojis = [...factionImagesOrEmojis];
                      newImagesOrEmojis[i] = e.target.value;
                      setFactionImagesOrEmojis(newImagesOrEmojis);
                    }} />
                  </label>
                </div>
              ))}
            </Form>
          </Offcanvas.Body>
        </Offcanvas>
      </>
    );
  }

  const showSidebar = () => {
    setIsPaused('pauseAndShowSidebar');
    setTriggerSidebar(!triggerSidebar);
  };

  return (
    <Container fluid>
      <Row>
        {/* Sidebar */}
        <Col>
          <button onClick={showSidebar}>
            ☰
          </button>
          <Sidebar />
        </Col>
        {/* Main Content */}
        <Col>
          <Row>
            {/* React Bootstrap Toggle Buttons */}
            <button onClick={() => setIsPaused(!isPaused)}>
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button onClick={() => setIsLastOneStandingMode(!isLastOneStandingMode)}>
              {isLastOneStandingMode ? 'Disable Last One Standing Mode' : 'Enable Last One Standing Mode'}
            </button>
            <button onClick={initializeFactions}>
              Restart
            </button>
          </Row>
          <Row>
            <div
              style={{
                height: '100vh',
                width: '100vw',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {factions.map((faction, factionIndex) =>
                faction.members.map((member, i) =>
                  renderMember(faction, factionIndex, member, i)
                )
              )}
            </div>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default App;
