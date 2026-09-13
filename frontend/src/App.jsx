const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import "./App.css";


function formatReceiptDate(date) {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  });
}

function downloadBookingReceipt(booking, user) {
  const pdf = new jsPDF();

  const orange = [255, 90, 54];
  const dark = [24, 32, 51];
  const gray = [110, 110, 110];

  const startDate = new Date(booking.start_date);
  const endDate = new Date(booking.end_date);

  const days = Math.max(
    1,
    Math.ceil(
      (endDate.getTime() - startDate.getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  pdf.setFillColor(...dark);
  pdf.rect(0, 0, 210, 35, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont("helvetica", "bold");
  pdf.text("Drive", 20, 18);

  pdf.setTextColor(...orange);
  pdf.text("Ease", 49, 18);

  pdf.setTextColor(190, 190, 190);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text("Vehicle Rental", 20, 27);

  pdf.setTextColor(...dark);
  pdf.setFontSize(22);
  pdf.setFont("helvetica", "bold");
  pdf.text("Booking Receipt", 20, 55);

  pdf.setDrawColor(...orange);
  pdf.setLineWidth(1);
  pdf.line(20, 62, 190, 62);

  const customerName =
    booking.user_name || user?.name || "Customer";

  const customerEmail =
    booking.user_email || user?.email || "";

  const details = [
    ["Booking ID", `#${booking.id}`],
    ["Customer", customerName],
    ["Email", customerEmail],
    ["Vehicle", booking.vehicle_name || ""],
    ["Brand", booking.brand || ""],
    ["Pickup Location", booking.pickup_location || ""],
    ["Pickup Date", formatReceiptDate(booking.start_date)],
    ["Return Date", formatReceiptDate(booking.end_date)],
    ["Status", booking.status || ""]
  ];

  let y = 78;

  details.forEach(([label, value]) => {
    pdf.setTextColor(...gray);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text(label, 20, y);

    pdf.setTextColor(...dark);
    pdf.setFont("helvetica", "normal");
    pdf.text(String(value), 75, y);

    y += 12;
  });

  y += 5;

  pdf.setFillColor(248, 248, 249);
  pdf.roundedRect(20, y, 170, 42, 4, 4, "F");

  pdf.setTextColor(...dark);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("Payment Summary", 28, y + 12);

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");

  pdf.text(
    `Rental Duration: ${days} day${days !== 1 ? "s" : ""}`,
    28,
    y + 23
  );

  pdf.text(
    `Price per Day: Rs. ${Number(
      booking.price_per_day
    ).toLocaleString("en-IN")}`,
    28,
    y + 33
  );

  pdf.setTextColor(...orange);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);

  pdf.text(
    `Total: Rs. ${Number(
      booking.total_price
    ).toLocaleString("en-IN")}`,
    125,
    y + 28
  );

  pdf.setTextColor(...gray);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);

  pdf.text(
    "Thank you for choosing DriveEase.",
    20,
    275
  );

  pdf.text(
    "Simple, reliable and affordable vehicle rentals.",
    20,
    282
  );

  pdf.save(`DriveEase-Booking-${booking.id}.pdf`);
}

function App() {
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [view, setView] = useState("home");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationBooking, setConfirmationBooking] = useState(null);

  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [bookingForm, setBookingForm] = useState({
    start_date: "",
    end_date: "",
    pickup_location: ""
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (token) {
      getCurrentUser();
    }
  }, [token]);

  async function fetchVehicles(query = "", vehicleType = "") {
    try {
      let url = `${API}/vehicles/search?`;

      if (query) {
        url += `q=${encodeURIComponent(query)}&`;
      }

      if (vehicleType) {
        url += `type=${encodeURIComponent(vehicleType)}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load vehicles");
      }

      setVehicles(Array.isArray(data) ? data : []);
    } catch {
      setMessage("Unable to load vehicles");
    }
  }

  async function getCurrentUser() {
    try {
      const response = await fetch(`${API}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
      } else {
        logout();
      }
    } catch {
      logout();
    }
  }

  async function register(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(authForm)
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      setMessage("Registration successful! Please login.");

      setAuthForm({
        name: "",
        email: "",
        password: ""
      });

      setView("login");
    } catch {
      setMessage("Registration failed");
    } finally {
      setLoading(false);
    }
  }

  async function login(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: authForm.email,
          password: authForm.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      localStorage.setItem("token", data.token);

      setToken(data.token);
      setUser(data.user);

      setAuthForm({
        name: "",
        email: "",
        password: ""
      });

      setView("home");
      setMessage("Welcome back!");
    } catch {
      setMessage("Login failed");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");

    setToken(null);
    setUser(null);
    setBookings([]);
    setView("home");
    setMessage("Logged out successfully");
  }

  async function fetchBookings() {
    if (!token) {
      setView("login");
      setMessage("Please login to view your bookings");
      return;
    }

    try {
      const response = await fetch(`${API}/bookings/my`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setBookings(data);
        setView("bookings");
      } else {
        setMessage(data.message);
      }
    } catch {
      setMessage("Unable to load bookings");
    }
  }

  async function createBooking(e) {
    e.preventDefault();

    if (!token) {
      setView("login");
      return;
    }

    if (!bookingForm.start_date || !bookingForm.end_date) {
      setMessage("Please select both dates");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(`${bookingForm.start_date}T00:00:00`);
    const end = new Date(`${bookingForm.end_date}T00:00:00`);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setMessage("Please select valid dates");
      return;
    }

    if (start < today) {
      setMessage("Pickup date cannot be in the past");
      return;
    }

    if (end <= start) {
      setMessage("Return date must be after pickup date");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          vehicle_id: selectedVehicle.id,
          start_date: bookingForm.start_date,
          end_date: bookingForm.end_date,
          pickup_location: bookingForm.pickup_location
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      setConfirmationBooking(data.booking);
      setMessage("");

      setBookingForm({
        start_date: "",
        end_date: "",
        pickup_location: ""
      });

      setSelectedVehicle(null);
      setView("booking-confirmed");
    } catch {
      setMessage("Booking failed");
    } finally {
      setLoading(false);
    }
  }

  async function cancelBooking(id) {
    if (!window.confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    try {
      const response = await fetch(`${API}/bookings/${id}/cancel`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Booking cancelled successfully");
        fetchBookings();
      } else {
        setMessage(data.message);
      }
    } catch {
      setMessage("Unable to cancel booking");
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    fetchVehicles(search, type);
  }

  function selectType(value) {
    setType(value);
    fetchVehicles(search, value);
  }

  return (
    <div className="app">
      <header className="navbar">
        <div className="logo" onClick={() => setView("home")}>
          <span>🚗</span>

          <div>
            <strong>
              Drive<span>Ease</span>
            </strong>

            <small>Vehicle Rental</small>
          </div>
        </div>

        <nav>
          <button onClick={() => setView("home")}>
            Home
          </button>

          <button onClick={() => setView("vehicles")}>
            Vehicles
          </button>

          <button onClick={() => setView("contact")}>
            Contact
          </button>

          {user && (
            <button onClick={fetchBookings}>
              My Bookings
            </button>
          )}
        </nav>

        <div className="nav-actions">
          {user ? (
            <>
              <span className="welcome">
                Hi, {user.name}
              </span>

              {user.role === "admin" && (
                <button
                  className="admin-btn"
                  onClick={() => setView("admin")}
                >
                  Admin
                </button>
              )}

              <button
                className="outline-btn"
                onClick={logout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                className="login-btn"
                onClick={() => {
                  setMessage("");
                  setView("login");
                }}
              >
                Login
              </button>

              <button
                className="primary-btn"
                onClick={() => {
                  setMessage("");
                  setView("register");
                }}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </header>

      {message && (
        <div className="message">
          {message}

          <button onClick={() => setMessage("")}>
            ×
          </button>
        </div>
      )}

      {view === "home" && (
        <>
          <section className="hero-section">
            <div className="hero-content">
              <div className="hero-tag">
                🚘 YOUR JOURNEY STARTS HERE
              </div>

              <h1>
                Rent a car.
                <br />
                <span>Drive your way.</span>
              </h1>

              <p>
                Find the perfect vehicle for your next adventure.
                Easy booking, affordable prices and a smooth
                rental experience.
              </p>

              <div className="hero-buttons">
                <button
                  className="hero-primary"
                  onClick={() => setView("vehicles")}
                >
                  Browse Vehicles →
                </button>

                {!user && (
                  <button
                    className="hero-secondary"
                    onClick={() => setView("register")}
                  >
                    Create Account
                  </button>
                )}
              </div>
            </div>

            <div className="hero-car">
              <div className="car-glow"></div>
              <img
                className="hero-car-image"
                src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=85"
                alt="Rental car"
              />
            </div>
          </section>

          <section className="search-section">
            <div className="search-header">
              <h2>Find your perfect ride</h2>

              <p>
                Search from our collection of reliable vehicles
              </p>
            </div>

            <form
              className="search-box"
              onSubmit={handleSearch}
            >
              <div className="search-input">
                <span>🔎</span>

                <input
                  type="text"
                  placeholder="Search vehicle or brand..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                value={type}
                onChange={(e) =>
                  selectType(e.target.value)
                }
              >
                <option value="">All Types</option>
                <option value="Hatchback">
                  Hatchback
                </option>
                <option value="Sedan">
                  Sedan
                </option>
                <option value="SUV">
                  SUV
                </option>
              </select>

              <button type="submit">
                Search
              </button>
            </form>
          </section>

          <VehicleList
            vehicles={vehicles}
            onSelect={setSelectedVehicle}
          />

          <WhyChooseDriveEase />
        </>
      )}

      {view === "vehicles" && (
        <main className="page">
          <div className="page-heading">
            <span>OUR FLEET</span>

            <h1>Choose your ride</h1>

            <p>
              Explore our available vehicles and find the one
              that fits your journey.
            </p>
          </div>

          <form
            className="search-box vehicles-search"
            onSubmit={handleSearch}
          >
            <div className="search-input">
              <span>🔎</span>

              <input
                type="text"
                placeholder="Search vehicle or brand..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              value={type}
              onChange={(e) =>
                selectType(e.target.value)
              }
            >
              <option value="">All Types</option>
              <option value="Hatchback">
                Hatchback
              </option>
              <option value="Sedan">
                Sedan
              </option>
              <option value="SUV">
                SUV
              </option>
            </select>

            <button type="submit">
              Search
            </button>
          </form>

          <VehicleList
            vehicles={vehicles}
            onSelect={setSelectedVehicle}
          />
        </main>
      )}

      {view === "login" && (
        <AuthPage
          title="Welcome back"
          subtitle="Login to continue your journey"
          button="Login"
          onSubmit={login}
          loading={loading}
          form={authForm}
          setForm={setAuthForm}
          login
          switchText="Don't have an account?"
          switchAction={() => setView("register")}
        />
      )}

      {view === "register" && (
        <AuthPage
          title="Create your account"
          subtitle="Join DriveEase and start your journey"
          button="Create Account"
          onSubmit={register}
          loading={loading}
          form={authForm}
          setForm={setAuthForm}
          register
          switchText="Already have an account?"
          switchAction={() => setView("login")}
        />
      )}

      {view === "contact" && (
        <ContactPage setMessage={setMessage} />
      )}

      {view === "bookings" && (
        <Bookings
          bookings={bookings}
          onCancel={cancelBooking}
          user={user}
        />
      )}

      {view === "booking-confirmed" && confirmationBooking && (
        <BookingConfirmation
          booking={confirmationBooking}
          onBookings={fetchBookings}
          onVehicles={() => setView("vehicles")}
        />
      )}

      {view === "admin" && (
        <AdminPage />
      )}

      {selectedVehicle && (
        <VehicleModal
          vehicle={selectedVehicle}
          form={bookingForm}
          setForm={setBookingForm}
          onClose={() => setSelectedVehicle(null)}
          onSubmit={createBooking}
          user={user}
          loading={loading}
          onLogin={() => {
            setSelectedVehicle(null);
            setView("login");
          }}
        />
      )}

      <footer>
        <div className="footer-container">
          <div className="footer-brand">
            <div className="footer-logo">
              🚗 <strong>Drive<span>Ease</span></strong>
            </div>
            <p>
              Simple, reliable and affordable vehicle rentals for every journey.
            </p>
          </div>

          <div className="footer-column">
            <h3>Quick Links</h3>
            <button onClick={() => setView("home")}>Home</button>
            <button onClick={() => setView("vehicles")}>Vehicles</button>
            <button onClick={fetchBookings}>My Bookings</button>
            <button onClick={() => setView("contact")}>Contact Us</button>
          </div>

          <div className="footer-column">
            <h3>Support</h3>
            <button onClick={() => setView("contact")}>Booking Help</button>
            <button onClick={() => setView("contact")}>Contact Support</button>
            <span>Mon - Sat · 9 AM - 7 PM</span>
            <span>Hyderabad, Telangana</span>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">
            © 2026 DriveEase. All rights reserved.
          </p>
          <span>Built for better journeys. 🚗</span>
        </div>
      </footer>
    </div>
  );
}
function WhyChooseDriveEase() {
  const benefits = [
    {
      icon: "🚗",
      title: "Verified Vehicles",
      text: "Choose from reliable vehicles that are ready for your journey."
    },
    {
      icon: "⚡",
      title: "Easy Booking",
      text: "Search, select your dates and reserve your ride in just a few clicks."
    },
    {
      icon: "💰",
      title: "Transparent Pricing",
      text: "See clear daily rental prices with no confusing hidden charges."
    },
    {
      icon: "🛟",
      title: "Reliable Support",
      text: "Get help with your booking whenever you need it."
    }
  ];

  return (
    <section className="why-section">
      <div className="why-heading">
        <span>WHY DRIVE WITH US</span>
        <h2>Why Choose DriveEase?</h2>
        <p>
          Everything you need for a simple, comfortable and hassle-free rental experience.
        </p>
      </div>

      <div className="why-grid">
        {benefits.map((benefit) => (
          <article className="why-card" key={benefit.title}>
            <div className="why-icon">{benefit.icon}</div>
            <h3>{benefit.title}</h3>
            <p>{benefit.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function VehicleList({ vehicles, onSelect }) {
  return (
    <section className="vehicles-section">
      <div className="section-heading">
        <div>
          <span>EXPLORE OUR FLEET</span>
          <h2>Popular vehicles</h2>
        </div>

        <p>{vehicles.length} vehicles available</p>
      </div>

      {vehicles.length === 0 ? (
        <div className="empty">
          <div>🚘</div>
          <h3>No vehicles found</h3>
          <p>Try another search or vehicle type.</p>
        </div>
      ) : (
        <div className="vehicle-grid">
          {vehicles.map((vehicle) => (
            <article className="vehicle-card" key={vehicle.id}>
              <div className="vehicle-image">
                <img
                  src={vehicle.image}
                  alt={vehicle.name}
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80";
                  }}
                />

                <div className="vehicle-overlay"></div>

                <span className="vehicle-type-badge">
                  {vehicle.type}
                </span>

                {vehicle.available ? (
                  <span className="availability-badge">
                    ● Available
                  </span>
                ) : (
                  <span className="availability-badge unavailable">
                    ● Unavailable
                  </span>
                )}
              </div>

              <div className="vehicle-info">
                <div className="vehicle-title">
                  <div>
                    <small>{vehicle.brand}</small>
                    <h3>{vehicle.name}</h3>
                  </div>

                  <div className="price">
                    ₹{Number(vehicle.price_per_day).toLocaleString()}
                    <small>/day</small>
                  </div>
                </div>

                <p>{vehicle.description}</p>

                <div className="vehicle-footer">
                  <div className="vehicle-feature">
                    <span>⚡</span>
                    Easy booking
                  </div>

                  <button
                    className="book-btn"
                    onClick={() => onSelect(vehicle)}
                    disabled={!vehicle.available}
                  >
                    {vehicle.available ? "View & Book →" : "Unavailable"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
function AuthPage({
  title,
  subtitle,
  button,
  onSubmit,
  loading,
  form,
  setForm,
  register,
  switchText,
  switchAction
}) {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-icon">
          🚗
        </div>

        <h1>{title}</h1>

        <p>{subtitle}</p>

        <form onSubmit={onSubmit}>
          {register && (
            <div className="form-group">
              <label>Full Name</label>

              <input
                type="text"
                placeholder="Enter your name"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value
                  })
                }
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value
                })
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) =>
                setForm({
                  ...form,
                  password: e.target.value
                })
              }
              required
            />
          </div>

          <button
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : button}
          </button>
        </form>

        <div className="auth-switch">
          {switchText}

          <button onClick={switchAction}>
            {register
              ? "Login"
              : "Sign Up"}
          </button>
        </div>
      </div>
    </main>
  );
}
function VehicleSpecifications({ vehicle }) {
  const specs = getVehicleSpecifications(vehicle);

  return (
    <div className="vehicle-specifications">
      <div className="specifications-heading">
        <span>VEHICLE DETAILS</span>
        <h3>Specifications</h3>
      </div>

      <div className="specifications-grid">
        <div className="spec-item">
          <span className="spec-icon">👥</span>
          <div>
            <small>SEATS</small>
            <strong>{specs.seats}</strong>
          </div>
        </div>

        <div className="spec-item">
          <span className="spec-icon">⚙️</span>
          <div>
            <small>TRANSMISSION</small>
            <strong>{specs.transmission}</strong>
          </div>
        </div>

        <div className="spec-item">
          <span className="spec-icon">⛽</span>
          <div>
            <small>FUEL</small>
            <strong>{specs.fuel}</strong>
          </div>
        </div>

        <div className="spec-item">
          <span className="spec-icon">🛣️</span>
          <div>
            <small>MILEAGE</small>
            <strong>{specs.mileage}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function getVehicleSpecifications(vehicle) {
  const specifications = {
    Swift: {
      seats: 5,
      transmission: "Manual",
      fuel: "Petrol",
      mileage: "22 km/l"
    },
    Creta: {
      seats: 5,
      transmission: "Automatic",
      fuel: "Petrol",
      mileage: "17 km/l"
    },
    City: {
      seats: 5,
      transmission: "Manual",
      fuel: "Petrol",
      mileage: "17.8 km/l"
    },
    Fortuner: {
      seats: 7,
      transmission: "Automatic",
      fuel: "Diesel",
      mileage: "14.4 km/l"
    },
    Nexon: {
      seats: 5,
      transmission: "Manual",
      fuel: "Petrol",
      mileage: "17.4 km/l"
    },
    Thar: {
      seats: 4,
      transmission: "Manual",
      fuel: "Petrol",
      mileage: "15.2 km/l"
    }
  };

  if (specifications[vehicle.name]) {
    return specifications[vehicle.name];
  }

  const defaults = {
    Hatchback: { seats: 5, transmission: "Manual", fuel: "Petrol", mileage: "18 km/l" },
    Sedan: { seats: 5, transmission: "Manual", fuel: "Petrol", mileage: "17 km/l" },
    SUV: { seats: 5, transmission: "Automatic", fuel: "Petrol", mileage: "15 km/l" }
  };

  return defaults[vehicle.type] || {
    seats: 5,
    transmission: "Manual",
    fuel: "Petrol",
    mileage: "15 km/l"
  };
}

function VehicleModal({
  vehicle,
  form,
  setForm,
  onClose,
  onSubmit,
  user,
  loading,
  onLogin
}) {
  const start = form.start_date
    ? new Date(`${form.start_date}T00:00:00`)
    : null;

  const end = form.end_date
    ? new Date(`${form.end_date}T00:00:00`)
    : null;

  let days = 0;

  if (start && end && end > start) {
    days = Math.ceil(
      (end - start) / (1000 * 60 * 60 * 24)
    );
  }

  const pricePerDay = Number(vehicle.price_per_day);
  const subtotal = days * pricePerDay;
  const total = subtotal;

  const today = getLocalDateString();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="booking-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="close-btn"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <div className="booking-modal-image">
          <img
            src={vehicle.image}
            alt={vehicle.name}
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=85";
            }}
          />

          <span className="modal-type-badge">
            {vehicle.type}
          </span>
        </div>

        <div className="booking-modal-content">
          <div className="modal-vehicle-header">
            <div>
              <small>{vehicle.brand}</small>
              <h2>{vehicle.name}</h2>
            </div>

            <div className="modal-price">
              ₹{pricePerDay.toLocaleString()}
              <span>/day</span>
            </div>
          </div>

          <p className="modal-description">
            {vehicle.description}
          </p>

          <VehicleSpecifications vehicle={vehicle} />

          {user ? (
            <form
              onSubmit={onSubmit}
              className="booking-form"
            >
              <div className="booking-form-title">
                <div>
                  <span>BOOK YOUR RIDE</span>
                  <h3>Choose your pickup & dates</h3>
                </div>

                <div className="booking-icon">
                  📅
                </div>
              </div>

              <div className="form-group pickup-location-group">
                <label>Pickup Location</label>
                <select
                  value={form.pickup_location}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      pickup_location: e.target.value
                    })
                  }
                  required
                >
                  <option value="">Select pickup location</option>
                  <option value="Gachibowli">Gachibowli</option>
                  <option value="Hitech City">Hitech City</option>
                  <option value="Secunderabad">Secunderabad</option>
                  <option value="Hyderabad Airport">Hyderabad Airport</option>
                </select>
              </div>

              <div className="date-row">
                <div className="form-group">
                  <label>Pickup Date</label>

                  <input
                    type="date"
                    min={today}
                    value={form.start_date}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        start_date: e.target.value,
                        end_date:
                          form.end_date &&
                          e.target.value >= form.end_date
                            ? ""
                            : form.end_date
                      })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Return Date</label>

                  <input
                    type="date"
                    min={
                      form.start_date
                        ? getNextDateString(form.start_date)
                        : today
                    }
                    value={form.end_date}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        end_date: e.target.value
                      })
                    }
                    required
                  />
                </div>
              </div>

              {days > 0 && (
                <div className="price-breakdown">
                  <div className="breakdown-title">
                    <span>Price breakdown</span>
                    <strong>{days} days</strong>
                  </div>

                  <div className="breakdown-row">
                    <span>
                      ₹{pricePerDay.toLocaleString()} × {days} days
                    </span>

                    <span>
                      ₹{subtotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="breakdown-total">
                    <span>Total</span>

                    <strong>
                      ₹{total.toLocaleString()}
                    </strong>
                  </div>
                </div>
              )}

              <button
                className="confirm-btn"
                disabled={loading}
              >
                {loading
                  ? "Confirming booking..."
                  : "Confirm Booking →"}
              </button>

              <p className="booking-note">
                🔒 Secure booking · No hidden charges
              </p>
            </form>
          ) : (
            <div className="login-booking">
              <div className="login-booking-icon">
                🔐
              </div>

              <h3>Login to book this vehicle</h3>

              <p>
                Create an account or login to continue
                with your booking.
              </p>

              <button
                className="confirm-btn"
                onClick={onLogin}
              >
                Login to Book →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function Bookings({
  bookings,
  onCancel,
  user
}) {
  const [cancelTarget, setCancelTarget] = useState(null);

  return (
    <main className="page bookings-page">
      <div className="bookings-heading">
        <div>
          <span>YOUR JOURNEYS</span>
          <h1>My Bookings</h1>
          <p>
            Manage your vehicle rentals and upcoming journeys.
          </p>
        </div>

        <div className="booking-count">
          <strong>{bookings.length}</strong>
          <span>Total bookings</span>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="empty bookings-empty">
          <div>🚗</div>

          <h3>No bookings yet</h3>

          <p>
            Your upcoming rentals will appear here.
          </p>
        </div>
      ) : (
        <div className="booking-list">
          {bookings.map((booking) => {
            const start = new Date(booking.start_date);
const end = new Date(booking.end_date);

const days = Math.max(
  1,
  Math.ceil(
    (end.getTime() - start.getTime()) /
      (1000 * 60 * 60 * 24)
  )
);

            return (
              <article
                className="booking-card"
                key={booking.id}
              >
                <div className="booking-image">
                  <img
                    src={booking.image}
                    alt={booking.vehicle_name}
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80";
                    }}
                  />

                  <span className="booking-type">
                    {booking.type}
                  </span>
                </div>

                <div className="booking-main">
                  <div className="booking-top">
                    <div>
                      <small>{booking.brand}</small>

                      <h2>{booking.vehicle_name}</h2>

                      <span className="booking-id">
                        Booking #{booking.id}
                      </span>
                    </div>

                    <span
                      className={`status ${booking.status}`}
                    >
                      <span>●</span>
                      {booking.status}
                    </span>
                  </div>

                  <div className="booking-details">
                    <div className="booking-date">
                      <span>📅</span>

                      <div>
                        <small>PICKUP</small>

                        <strong>
                          {formatDate(booking.start_date)}
                        </strong>
                      </div>
                    </div>

                    <div className="booking-route">
                      <div></div>
                      <span>→</span>
                      <div></div>
                    </div>

                    <div className="booking-date">
                      <span>🏁</span>

                      <div>
                        <small>RETURN</small>

                        <strong>
                          {formatDate(booking.end_date)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="booking-bottom">
                    <div className="booking-meta">
                      <span>
                        ⏱️ {days} rental {days === 1 ? "day" : "days"}
                      </span>

                      <span>
                        📍 {booking.pickup_location}
                      </span>
                    </div>

                    <div className="booking-total">
                      <small>Total amount</small>

                      <strong>
                        ₹
                        {Number(
                          booking.total_price
                        ).toLocaleString()}
                      </strong>
                    </div>

                    <button
                      className="receipt-button"
                      onClick={() =>
                        downloadBookingReceipt(booking, user)
                      }
                    >
                      🧾 Download Receipt
                    </button>

                    {[
                      "pending",
                      "confirmed"
                    ].includes(booking.status) && (
                      <button
                        className="cancel-booking-btn"
                        onClick={() =>
                          setCancelTarget(booking)
                        }
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {cancelTarget && (
        <div className="modal-overlay" onClick={() => setCancelTarget(null)}>
          <div className="cancel-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cancel-icon">⚠️</div>
            <h2>Cancel this booking?</h2>
            <p>
              Are you sure you want to cancel booking #{cancelTarget.id} for {cancelTarget.vehicle_name}?
            </p>
            <div className="cancel-actions">
              <button className="outline-btn" onClick={() => setCancelTarget(null)}>
                Keep Booking
              </button>
              <button
                className="cancel-confirm-btn"
                onClick={() => {
                  onCancel(cancelTarget.id);
                  setCancelTarget(null);
                }}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
function BookingConfirmation({ booking, onBookings, onVehicles }) {
  return (
    <main className="confirmation-page">
      <div className="confirmation-card">
        <div className="confirmation-icon">✓</div>
        <span className="confirmation-label">BOOKING CONFIRMED</span>
        <h1>Your ride is reserved! 🎉</h1>
        <p>Your booking has been successfully created.</p>

        <div className="confirmation-summary">
          <div className="confirmation-summary-header">
            <div>
              <small>BOOKING ID</small>
              <strong>#{booking.id}</strong>
            </div>
            <span className={`status ${booking.status}`}>● {booking.status}</span>
          </div>

          <div className="confirmation-grid">
            <div><small>VEHICLE</small><strong>{booking.vehicle_name}</strong></div>
            <div><small>PICKUP LOCATION</small><strong>📍 {booking.pickup_location}</strong></div>
            <div><small>PICKUP DATE</small><strong>{formatDate(booking.start_date)}</strong></div>
            <div><small>RETURN DATE</small><strong>{formatDate(booking.end_date)}</strong></div>
            <div><small>RENTAL DAYS</small><strong>{booking.days} {booking.days === 1 ? "day" : "days"}</strong></div>
            <div><small>PRICE / DAY</small><strong>₹{Number(booking.price_per_day).toLocaleString()}</strong></div>
          </div>

          <div className="confirmation-total">
            <span>Total amount</span>
            <strong>₹{Number(booking.total_price).toLocaleString()}</strong>
          </div>
        </div>

        <div className="confirmation-actions">
          <button className="primary-btn" onClick={onBookings}>View My Bookings</button>
          <button className="outline-btn" onClick={onVehicles}>Browse More Vehicles</button>
        </div>
      </div>
    </main>
  );
}
function AdminPage() {
  const token =
    localStorage.getItem("token");

  const [stats, setStats] =
    useState(null);

  const [vehicles, setVehicles] =
    useState([]);

  const [bookings, setBookings] =
    useState([]);

  const [users, setUsers] =
    useState([]);

  const [tab, setTab] =
    useState("overview");

  const [showForm, setShowForm] =
    useState(false);

  const [
    editingVehicle,
    setEditingVehicle
  ] = useState(null);

  const [message, setMessage] =
    useState("");

  const [form, setForm] = useState({
    name: "",
    brand: "",
    type: "SUV",
    price_per_day: "",
    image: "",
    description: "",
    available: true
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const headers = {
        Authorization: `Bearer ${token}`
      };

      const [
        statsRes,
        vehiclesRes,
        bookingsRes,
        usersRes
      ] = await Promise.all([
        fetch(
          `${API}/admin/stats`,
          { headers }
        ),

        fetch(
          `${API}/vehicles`,
          { headers }
        ),

        fetch(
          `${API}/admin/bookings`,
          { headers }
        ),

        fetch(
          `${API}/admin/users`,
          { headers }
        )
      ]);

      if (
        statsRes.status === 401 ||
        statsRes.status === 403
      ) {
        setMessage(
          "You do not have admin access."
        );

        return;
      }

      setStats(
        await statsRes.json()
      );

      setVehicles(
        await vehiclesRes.json()
      );

      setBookings(
        await bookingsRes.json()
      );

      setUsers(
        await usersRes.json()
      );
    } catch {
      setMessage(
        "Unable to load admin dashboard"
      );
    }
  }

  function openAddForm() {
    setEditingVehicle(null);

    setForm({
      name: "",
      brand: "",
      type: "SUV",
      price_per_day: "",
      image: "",
      description: "",
      available: true
    });

    setShowForm(true);
  }

  function openEditForm(vehicle) {
    setEditingVehicle(vehicle);

    setForm({
      name: vehicle.name,
      brand: vehicle.brand,
      type: vehicle.type,
      price_per_day:
        vehicle.price_per_day,
      image: vehicle.image || "",
      description:
        vehicle.description || "",
      available:
        Boolean(vehicle.available)
    });

    setShowForm(true);
  }

  async function saveVehicle(e) {
    e.preventDefault();

    try {
      const url = editingVehicle
        ? `${API}/vehicles/${editingVehicle.id}`
        : `${API}/vehicles`;

      const method = editingVehicle
        ? "PUT"
        : "POST";

      const response = await fetch(
        url,
        {
          method,
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(form)
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      setMessage(
        editingVehicle
          ? "Vehicle updated successfully"
          : "Vehicle added successfully"
      );

      setShowForm(false);

      loadDashboard();
    } catch {
      setMessage(
        "Unable to save vehicle"
      );
    }
  }

  async function deleteVehicle(id) {
    if (
      !window.confirm(
        "Are you sure you want to delete this vehicle?"
      )
    ) {
      return;
    }

    try {
      const response =
        await fetch(
          `${API}/vehicles/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      setMessage(
        "Vehicle deleted successfully"
      );

      loadDashboard();
    } catch {
      setMessage(
        "Unable to delete vehicle"
      );
    }
  }

  async function updateBookingStatus(
    id,
    status
  ) {
    try {
      const response =
        await fetch(
          `${API}/admin/bookings/${id}/status`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`
            },
            body: JSON.stringify({
              status
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      setMessage(
        "Booking status updated"
      );

      loadDashboard();
    } catch {
      setMessage(
        "Unable to update booking"
      );
    }
  }

  return (
    <main className="admin-dashboard">
      <div className="admin-header">
        <div>
          <span>
            ADMIN PANEL
          </span>

          <h1>
            Dashboard
          </h1>

          <p>
            Manage vehicles,
            bookings and users.
          </p>
        </div>

        <button
          className="admin-add-btn"
          onClick={openAddForm}
        >
          + Add Vehicle
        </button>
      </div>

      {message && (
        <div className="admin-message">
          {message}

          <button
            onClick={() =>
              setMessage("")
            }
          >
            ×
          </button>
        </div>
      )}

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <span>🚗</span>

            <div>
              <small>
                Total Vehicles
              </small>

              <strong>
                {stats.vehicles}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <span>👥</span>

            <div>
              <small>
                Registered Users
              </small>

              <strong>
                {stats.users}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <span>📋</span>

            <div>
              <small>
                Total Bookings
              </small>

              <strong>
                {stats.bookings}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <span>💰</span>

            <div>
              <small>
                Revenue
              </small>

              <strong>
                ₹
                {Number(
                  stats.revenue
                ).toLocaleString()}
              </strong>
            </div>
          </div>
        </div>
      )}

      <div className="admin-tabs">
        <button
          className={
            tab === "overview"
              ? "active"
              : ""
          }
          onClick={() =>
            setTab("overview")
          }
        >
          Overview
        </button>

        <button
          className={
            tab === "vehicles"
              ? "active"
              : ""
          }
          onClick={() =>
            setTab("vehicles")
          }
        >
          Vehicles
        </button>

        <button
          className={
            tab === "bookings"
              ? "active"
              : ""
          }
          onClick={() =>
            setTab("bookings")
          }
        >
          Bookings
        </button>

        <button
          className={
            tab === "users"
              ? "active"
              : ""
          }
          onClick={() =>
            setTab("users")
          }
        >
          Users
        </button>
      </div>

      {tab === "overview" && (
        <div className="admin-overview">
          <div className="admin-welcome">
            <div>
              <span>🚀</span>

              <div>
                <h2>
                  DriveEase Admin
                </h2>

                <p>
                  Everything is ready
                  to manage your
                  rental platform.
                </p>
              </div>
            </div>
          </div>

          <div className="recent-box">
            <h2>
              Recent Bookings
            </h2>

            {bookings
              .slice(0, 5)
              .map((booking) => (
                <div
                  className="recent-booking"
                  key={booking.id}
                >
                  <div>
                    <strong>
                      {booking.vehicle_name}
                    </strong>

                    <small>
                      {booking.user_name}
                      {" · "}
                      {booking.user_email}
                    </small>
                  </div>

                  <span
                    className={`status ${booking.status}`}
                  >
                    {booking.status}
                  </span>

                  <strong>
                    ₹
                    {Number(
                      booking.total_price
                    ).toLocaleString()}
                  </strong>
                </div>
              ))}
          </div>
        </div>
      )}

      {tab === "vehicles" && (
        <div className="admin-table-card">
          <div className="table-heading">
            <div>
              <h2>
                Vehicle Management
              </h2>

              <p>
                Manage your rental fleet.
              </p>
            </div>

            <button
              className="admin-add-btn"
              onClick={openAddForm}
            >
              + Add Vehicle
            </button>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>
                    Vehicle
                  </th>

                  <th>
                    Brand
                  </th>

                  <th>
                    Type
                  </th>

                  <th>
                    Price
                  </th>

                  <th>
                    Available
                  </th>

                  <th>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {vehicles.map(
                  (vehicle) => (
                    <tr
                      key={vehicle.id}
                    >
                      <td>
                        <strong>
                          {vehicle.name}
                        </strong>
                      </td>

                      <td>
                        {vehicle.brand}
                      </td>

                      <td>
                        <span className="table-type">
                          {vehicle.type}
                        </span>
                      </td>

                      <td>
                        ₹
                        {Number(
                          vehicle.price_per_day
                        ).toLocaleString()}
                      </td>

                      <td>
                        <span
                          className={
                            vehicle.available
                              ? "available"
                              : "unavailable"
                          }
                        >
                          {vehicle.available
                            ? "Yes"
                            : "No"}
                        </span>
                      </td>

                      <td>
                        <div className="table-actions">
                          <button
                            onClick={() =>
                              openEditForm(
                                vehicle
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="delete"
                            onClick={() =>
                              deleteVehicle(
                                vehicle.id
                              )
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "bookings" && (
        <div className="admin-table-card">
          <div className="table-heading">
            <div>
              <h2>
                Booking Management
              </h2>

              <p>
                View and update customer
                bookings.
              </p>
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>
                    Customer
                  </th>

                  <th>
                    Vehicle
                  </th>

                  <th>
                    Pickup
                  </th>

                  <th>
                    Dates
                  </th>

                  <th>
                    Total
                  </th>

                  <th>
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {bookings.map(
                  (booking) => (
                    <tr
                      key={booking.id}
                    >
                      <td>
                        <strong>
                          {booking.user_name}
                        </strong>

                        <small className="email-cell">
                          {booking.user_email}
                        </small>
                      </td>

                      <td>
                        {booking.brand}{" "}
                        {booking.vehicle_name}
                      </td>

                      <td>
                        📍 {booking.pickup_location}
                      </td>

                      <td>
                        {formatDate(
                          booking.start_date
                        )}

                        <br />

                        →

                        <br />

                        {formatDate(
                          booking.end_date
                        )}
                      </td>

                      <td>
                        ₹
                        {Number(
                          booking.total_price
                        ).toLocaleString()}
                      </td>

                      <td>
                        <select
                          className="status-select"
                          value={
                            booking.status
                          }
                          onChange={(e) =>
                            updateBookingStatus(
                              booking.id,
                              e.target.value
                            )
                          }
                        >
                          <option value="pending">
                            Pending
                          </option>

                          <option value="confirmed">
                            Confirmed
                          </option>

                          <option value="cancelled">
                            Cancelled
                          </option>

                          <option value="completed">
                            Completed
                          </option>
                        </select>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "users" && (
        <div className="admin-table-card">
          <div className="table-heading">
            <div>
              <h2>
                User Management
              </h2>

              <p>
                Registered DriveEase
                users.
              </p>
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>
                    Name
                  </th>

                  <th>
                    Email
                  </th>

                  <th>
                    Role
                  </th>

                  <th>
                    Joined
                  </th>
                </tr>
              </thead>

              <tbody>
                {users.map(
                  (user) => (
                    <tr
                      key={user.id}
                    >
                      <td>
                        <strong>
                          {user.name}
                        </strong>
                      </td>

                      <td>
                        {user.email}
                      </td>

                      <td>
                        <span
                          className={
                            user.role ===
                            "admin"
                              ? "admin-role"
                              : "user-role"
                          }
                        >
                          {user.role}
                        </span>
                      </td>

                      <td>
                        {formatDate(
                          user.created_at
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div
          className="admin-modal-overlay"
          onClick={() =>
            setShowForm(false)
          }
        >
          <div
            className="admin-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <button
              className="close-btn"
              onClick={() =>
                setShowForm(false)
              }
            >
              ×
            </button>

            <h2>
              {editingVehicle
                ? "Edit Vehicle"
                : "Add Vehicle"}
            </h2>

            <p>
              Enter the vehicle
              information below.
            </p>

            <form
              onSubmit={saveVehicle}
            >
              <div className="admin-form-grid">
                <div className="form-group">
                  <label>
                    Vehicle Name
                  </label>

                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name:
                          e.target.value
                      })
                    }
                    placeholder="e.g. Swift"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Brand
                  </label>

                  <input
                    value={form.brand}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        brand:
                          e.target.value
                      })
                    }
                    placeholder="e.g. Maruti Suzuki"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Type
                  </label>

                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        type:
                          e.target.value
                      })
                    }
                  >
                    <option>
                      Hatchback
                    </option>

                    <option>
                      Sedan
                    </option>

                    <option>
                      SUV
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Price Per Day
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={
                      form.price_per_day
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        price_per_day:
                          e.target.value
                      })
                    }
                    placeholder="2000"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  Image URL
                </label>

                <input
                  value={form.image}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      image:
                        e.target.value
                    })
                  }
                  placeholder="https://..."
                />
              </div>

              <div className="form-group">
                <label>
                  Description
                </label>

                <textarea
                  value={
                    form.description
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description:
                        e.target.value
                    })
                  }
                  placeholder="Describe the vehicle..."
                  rows="4"
                />
              </div>

              <label className="availability-check">
                <input
                  type="checkbox"
                  checked={
                    form.available
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      available:
                        e.target.checked
                    })
                  }
                />

                Vehicle is available
              </label>

              <button className="admin-save-btn">
                {editingVehicle
                  ? "Update Vehicle"
                  : "Add Vehicle"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function getLocalDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getNextDateString(dateString) {
  const date = new Date(`${dateString}T00:00:00`);

  if (isNaN(date.getTime())) {
    return getLocalDateString();
  }

  date.setDate(date.getDate() + 1);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(date) {
  if (!date) {
    return "";
  }

  const d = new Date(date);

  return d.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC"
    }
  );
}

export default App;

function ContactPage({ setMessage }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const [sending, setSending] = useState(false);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSending(true);

    setTimeout(() => {
      setSending(false);
      setMessage(
        "Message sent successfully! We'll get back to you soon. 🎉"
      );
      setForm({
        name: "",
        email: "",
        subject: "",
        message: ""
      });
    }, 700);
  }

  return (
    <main className="contact-page">
      <div className="contact-heading">
        <span>GET IN TOUCH</span>
        <h1>Contact Us</h1>
        <p>
          Have a question about your booking or our vehicles?
          We're here to help.
        </p>
      </div>

      <div className="contact-container">
        <div className="contact-info">
          <div className="contact-info-header">
            <span>DRIVE WITH CONFIDENCE</span>
            <h2>We're here to help.</h2>
            <p>
              Whether you need help choosing a vehicle, have a question
              about your booking, or simply want to know more about
              DriveEase, feel free to reach out.
            </p>
          </div>

          <div className="contact-item">
            <div className="contact-icon">📧</div>
            <div>
              <small>Email</small>
              <strong>support@driveease.com</strong>
            </div>
          </div>

          <div className="contact-item">
            <div className="contact-icon">📍</div>
            <div>
              <small>Location</small>
              <strong>Hyderabad, Telangana</strong>
            </div>
          </div>

          <div className="contact-item">
            <div className="contact-icon">🕐</div>
            <div>
              <small>Support Hours</small>
              <strong>Mon - Sat · 9:00 AM - 7:00 PM</strong>
            </div>
          </div>

          <div className="contact-support-box">
            <span>🚗</span>
            <div>
              <strong>Need help with a booking?</strong>
              <p>
                Keep your booking ID ready and our team can help you faster.
              </p>
            </div>
          </div>
        </div>

        <div className="contact-form-card">
          <div className="contact-form-heading">
            <span>SEND A MESSAGE</span>
            <h2>How can we help?</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="contact-form-row">
              <div className="form-group">
                <label>Your Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Subject</label>
              <input
                type="text"
                name="subject"
                placeholder="What can we help with?"
                value={form.subject}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Message</label>
              <textarea
                name="message"
                placeholder="Write your message..."
                value={form.message}
                onChange={handleChange}
                rows="6"
                required
              />
            </div>

            <button
              type="submit"
              className="contact-submit"
              disabled={sending}
            >
              {sending ? "Sending..." : "Send Message →"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
