import { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import { FileText, Link, Image as ImageIcon } from "lucide-react";
import "./styles.css";

export default function App() {
  const [people, setPeople] = useState([
    { id: 1, name: "A", paid: "", percent: 0 },
    { id: 2, name: "B", paid: "", percent: 0 }
  ]);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState("equal"); // equal | manual

  const shareRef = useRef();
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const totalAmount = Number(amount) || 0;

  const getOwes = (p) => {
    if (mode === "equal") {
      return totalAmount / people.length - (Number(p.paid) || 0);
    } else {
      const share = (totalAmount * (Number(p.percent) || 0)) / 100;
      return share - (Number(p.paid) || 0);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const data = params.get("data");

    if (data) {
      try {
        const parsed = JSON.parse(atob(data));

        const peopleWithPercent = parsed.people.map(p => ({
          ...p,
          percent: p.percent ?? 0
        }));

        setPeople(peopleWithPercent);
        setAmount(parsed.amount);
        setDescription(parsed.description);


        if (parsed.mode) {
          setMode(parsed.mode);
        } else {
          const hasCustomPercent = peopleWithPercent.some(p => Number(p.percent) > 0);
          setMode(hasCustomPercent ? "manual" : "equal");
        }

      } catch {}
    }
  }, []);

  const handleMouseMove = (e) => {
    setPos({ x: e.clientX, y: e.clientY });
  };

  const addPerson = () => {
    const nextLetter = String.fromCharCode(65 + people.length);

    setPeople([
      ...people,
      { id: Date.now(), name: nextLetter, paid: "", percent: 0 }
    ]);
  };

  const fillRemaining = () => {
  const totalUsed = people.reduce(
    (sum, p) => sum + (Number(p.percent) || 0),
    0
  );

  const remaining = 100 - totalUsed;

  const emptyUsers = people.filter(
    (p) => !p.percent || Number(p.percent) === 0
  );

  if (emptyUsers.length === 0) return;

  const split = remaining / emptyUsers.length;

  const updated = people.map((p) => {
    if (!p.percent || Number(p.percent) === 0) {
      return { ...p, percent: split.toFixed(2) };
    }
    return p;
  });

  setPeople(updated);
};

  const copyText = () => {
    let text = `💸 ${description || "Expense"}\n`;
    text += `Total: £${totalAmount}\n\n`;

    people.forEach((p) => {
      const owes = getOwes(p);
      text += `${p.name} - Owes £${owes.toFixed(2)}\n`;
    });

    navigator.clipboard.writeText(text);
  };

  const copyImage = async () => {
    const canvas = await html2canvas(shareRef.current, {
      backgroundColor: null,
      scale: 2
    });

    canvas.toBlob(async (blob) => {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob })
      ]);
    });
  };

  const copyLink = () => {
    const data = { people, amount, description, mode }
    const encoded = btoa(JSON.stringify(data));
    const url = `${window.location.origin}?data=${encoded}`;
    navigator.clipboard.writeText(url);
    alert("Link copied!");
  };

  return (
    <div className="app" onMouseMove={handleMouseMove}>
      {/* FLASHLIGHT */}
      <div
        className="flashlight"
        style={{
          background: `radial-gradient(circle at ${pos.x}px ${pos.y}px, rgba(99,102,241,0.12), transparent 140px)`
        }}
      />

      <div className="container">
        <h1 className="logo">
          <span className="logo-icon"></span> Splito
        </h1>

        {/* Expense */}
        <div className="card">
          <input
            className="full-input"
            type="text"
            placeholder="What was it for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            className="full-input"
            type="number"
            placeholder="£ Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {/* MODE TOGGLE */}
        <div className="mode-toggle">
          <button
            className={mode === "equal" ? "active" : ""}
            onClick={() => setMode("equal")}
          >
            Equal
          </button>
          <button
            className={mode === "manual" ? "active" : ""}
            onClick={() => setMode("manual")}
          >
            Manual %
          </button>
        </div>

        {/* People */}
        <div className={`card ${mode}`}>
          <div className={`table-header ${mode}`}>
            <span>Name</span>
            <span>Paid</span>
            {mode === "manual" && <span>%</span>}
            <span>Owes</span>
          </div>

          {people.map((p, i) => {
            const owes = getOwes(p);

            return (
              <div key={p.id} className={`person-row ${mode}`}>
                <input
                  value={p.name}
                  onChange={(e) => {
                    const updated = [...people];
                    updated[i].name = e.target.value;
                    setPeople(updated);
                  }}
                />

                <input
                  type="number"
                  placeholder="0"
                  value={p.paid}
                  onChange={(e) => {
                    const updated = [...people];
                    updated[i].paid = e.target.value;
                    setPeople(updated);
                  }}
                />

                {mode === "manual" && (
                  <input
                    type="number"
                    placeholder="%"
                    value={p.percent}
                    onChange={(e) => {
                      const updated = [...people];
                      updated[i].percent = e.target.value;
                      setPeople(updated);
                    }}
                  />
                )}

                <div
                  className={`result-box ${
                    owes > 0 ? "negative" : "positive"
                  }`}
                >
                  £{owes.toFixed(2)}
                </div>
              </div>
            );
          })}

          {mode === "manual" && (
            <button className="add-btn" onClick={fillRemaining}>
              Auto-fill remaining %
            </button>
          )}

          <button className="add-btn" onClick={addPerson}>
            + Add Person
          </button>
        </div>

        {/* helper text */}
        <p className="helper">
          Below you can copy text, image or share link with friends
        </p>

        {/* Actions */}
        <div className="actions">
          <button className="action-btn" onClick={copyText}>
            <FileText size={16} /> Text
          </button>

          <button className="action-btn" onClick={copyImage}>
            <ImageIcon size={16} /> Image
          </button>

          <button className="action-btn" onClick={copyLink}>
            <Link size={16} /> Link
          </button>
        </div>

        {/* Hidden Share */}
        <div className="hidden-share">
          <div className="share-card" ref={shareRef}>
            <h2>Splito</h2>
            <p>{description}</p>
            <p className="share-total">£{totalAmount}</p>

            {people.map((p, i) => {
              const owes = getOwes(p);

              return (
                <div key={i} className="share-row">
                  <span>{p.name}</span>
                  <span>£{owes.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}