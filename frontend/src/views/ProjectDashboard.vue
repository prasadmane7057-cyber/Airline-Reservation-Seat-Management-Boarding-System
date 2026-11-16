<template>
  <div class="project-dashboard">
    <!-- Top Hero Banner -->
    <header class="dashboard-hero">
      <div class="container hero-content">
        <div class="hero-left">
          <div class="hero-tag-row">
            <span class="eyebrow-tag">ACADEMIC &amp; SYSTEM INTEGRATION</span>
            <span class="api-live-tag" :class="{ connected: flightsLoaded }">
              <span class="pulsing-dot"></span>
              {{ flightApiStatus }}
            </span>
          </div>
          <h1 class="hero-title">Airline Master Integration Dashboard</h1>
          <p class="hero-desc">
            Operational values are loaded from the <strong>Express API / Supabase</strong>; academic panels are clearly marked as demo or native C++ output.
          </p>
        </div>

        <div class="hero-quick-stats">
          <div class="stat-pill">
            <span class="stat-number">4</span>
            <span class="stat-label">Coursework Subjects</span>
          </div>
          <div class="stat-pill">
            <span class="stat-number">{{ apiFlights.length }}</span>
            <span class="stat-label">API Flights</span>
          </div>
          <div class="stat-pill">
            <span class="stat-number" :class="occupancyStatusClass">{{ hasSeatData ? `${occupancyPercentage}%` : '—' }}</span>
            <span class="stat-label">API Seat Occupancy ({{ hasSeatData ? occupancyStatus : 'Not loaded' }})</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Navigation Tabs -->
    <div class="tab-nav-wrapper">
      <div class="container">
        <nav class="master-tabs" role="tablist">
          <button
            v-for="tab in mainTabs"
            :key="tab.id"
            type="button"
            role="tab"
            :aria-selected="activeMainTab === tab.id"
            :class="['master-tab-btn', { active: activeMainTab === tab.id }]"
            @click="activeMainTab = tab.id"
          >
            <span class="tab-badge-icon">{{ tab.icon }}</span>
            <span class="tab-title-text">{{ tab.name }}</span>
            <span class="tab-sub-text">{{ tab.sub }}</span>
          </button>
        </nav>
      </div>
    </div>

    <!-- Main Content Container -->
    <main class="container dashboard-body">

      <!-- =================================================================== -->
      <!-- TAB 1: OVERVIEW & OPERATIONAL API                                   -->
      <!-- =================================================================== -->
      <section v-show="activeMainTab === 'overview'" class="tab-section">
        <div class="section-intro">
          <div>
            <h2>Operational API &amp; Academic Integration</h2>
            <p class="subtitle">Live flight and seat data from the Express API backed by Supabase. Academic interactions are demo data unless marked native.</p>
          </div>
          <button class="btn btn-primary btn-sm" @click="refreshOperationalData" :disabled="loadingFlights || loadingOperations">
            <span v-if="loadingFlights || loadingOperations">Refreshing...</span>
            <span v-else>↻ Refresh API data</span>
          </button>
        </div>

        <p v-if="flightApiError" class="form-feedback error" role="alert">{{ flightApiError }}</p>

        <!-- Live API Metric Cards -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-icon blue">☁</div>
            <div class="metric-info">
            <span class="metric-label">Operational data source</span>
            <span class="metric-value">Express API / Supabase</span>
            <span class="metric-sub">Flight and seat endpoints</span>
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-icon green">✈</div>
            <div class="metric-info">
            <span class="metric-label">API flights</span>
            <span class="metric-value">{{ apiFlights.length }} Flights Loaded</span>
            <span class="metric-sub">GET /api/flights</span>
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-icon violet">☕</div>
            <div class="metric-info">
            <span class="metric-label">Academic panels</span>
            <span class="metric-value">Demo data</span>
            <span class="metric-sub">Except panels marked Native C++</span>
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-icon gold">⚙</div>
            <div class="metric-info">
            <span class="metric-label">Selected flight occupancy</span>
            <span class="metric-value" :class="occupancyStatusClass">{{ hasSeatData ? `${occupancyStatus} · ${occupancyPercentage}%` : 'Not loaded' }}</span>
            <span class="metric-sub">{{ hasSeatData ? `${availableSeatsCount} of ${totalSeatsCount} seats available` : 'Seat inventory unavailable' }}</span>
            </div>
          </div>
        </div>

        <!-- Operational Flight and Seat Data -->
        <div class="content-panel">
          <div class="panel-header">
            <div>
            <h3>Live Flight &amp; Seat Inventory <span class="badge-source">API / Supabase</span></h3>
            <p class="panel-hint">Flight records from <code>GET /api/flights</code>; selected flight inventory from <code>GET /api/seats/flight/:flightId</code>.</p>
            </div>
          <label class="flight-select-label">Selected flight
            <select v-model="selectedFlightId" class="form-input" @change="loadSelectedFlightSeats">
              <option value="">Choose a live flight</option>
              <option v-for="flight in apiFlights" :key="flight.id" :value="String(flight.id)">
                {{ flight.flight_number }} · {{ flight.destination }}
              </option>
            </select>
          </label>
          </div>

        <div v-if="loadingSeats" class="empty-cell">Loading selected flight seat inventory…</div>
        <p v-else-if="seatApiError" class="form-feedback error" role="alert">{{ seatApiError }}</p>
        <p v-else-if="!selectedFlight" class="empty-cell">Load flights from the API, then select a flight to view its seat inventory.</p>
        <div v-else class="occupancy-stats-grid api-seat-stats">
          <div class="stat-box"><small>TOTAL SEATS</small><strong>{{ totalSeatsCount }}</strong></div>
          <div class="stat-box green"><small>AVAILABLE</small><strong>{{ availableSeatsCount }}</strong></div>
          <div class="stat-box red"><small>BOOKED</small><strong>{{ bookedSeatsCount }}</strong></div>
          <div class="stat-box amber"><small>BLOCKED</small><strong>{{ blockedSeatsCount }}</strong></div>
          <div class="stat-box"><small>OCCUPANCY</small><strong>{{ hasSeatData ? `${occupancyPercentage}% · ${occupancyStatus}` : 'No API data' }}</strong></div>
          </div>

        <p v-if="!loadingFlights && apiFlights.length === 0 && !flightApiError" class="empty-cell">No flights were returned by the API.</p>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                <th>Flight</th><th>Destination</th><th>Status</th><th>Source</th>
                </tr>
              </thead>
              <tbody>
              <tr v-for="f in apiFlights" :key="f.id">
                <td><span class="flight-tag">{{ f.flight_number }}</span></td>
                <td>{{ f.destination }}</td>
                <td><span :class="['status-chip', getStatusClass(f.status)]">{{ f.status }}</span></td>
                <td><span class="badge-source">API / Supabase</span></td>
                </tr>
              <tr v-if="loadingFlights">
                <td colspan="4" class="empty-cell">Loading API flights…</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="content-panel">
        <div class="panel-header">
          <div>
            <h3>Restricted Operational Summary <span class="badge-source">Authenticated API</span></h3>
            <p class="panel-hint">Passenger and booking records are requested only for an authenticated admin account.</p>
          </div>
          <button v-if="authStore.isAdmin" class="btn btn-outline btn-sm" @click="loadAdminOperations" :disabled="loadingOperations">Refresh admin data</button>
        </div>
        <div v-if="!authStore.isAuthenticated" class="auth-notice">
          Admin sign-in is required to view bookings, passenger records, and dashboard statistics.
          <router-link :to="{ path: '/login', query: { redirect: '/project-dashboard' } }">Sign in</router-link>
        </div>
        <div v-else-if="!authStore.isAdmin" class="auth-notice">
          Admin authorization is required to view operational bookings and passenger records.
          <router-link to="/admin/dashboard">Open admin area</router-link>
        </div>
        <div v-else>
          <p v-if="operationsError" class="form-feedback error" role="alert">{{ operationsError }}</p>
          <p v-else-if="loadingOperations" class="empty-cell">Loading authenticated admin data…</p>
          <div v-else class="metrics-grid">
            <div class="metric-card"><div class="metric-info"><span class="metric-label">Flights</span><span class="metric-value">{{ operationalStats?.totalFlights ?? '—' }}</span></div></div>
            <div class="metric-card"><div class="metric-info"><span class="metric-label">Passengers</span><span class="metric-value">{{ operationalStats?.totalPassengers ?? adminStore.passengers.length }}</span></div></div>
            <div class="metric-card"><div class="metric-info"><span class="metric-label">Bookings</span><span class="metric-value">{{ operationalStats?.totalBookings ?? adminStore.bookings.length }}</span></div></div>
            <div class="metric-card"><div class="metric-info"><span class="metric-label">API data</span><span class="metric-value">Authenticated</span><span class="metric-sub">Stats, bookings, passengers</span></div></div>
          </div>
          <div class="admin-search-row">
            <label for="operational-search">Search by PNR or passenger ID</label>
            <input id="operational-search" v-model="operationalSearch" class="form-input" placeholder="Enter PNR or passenger ID" />
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>              <tr><th>PNR</th><th>Passenger</th><th>Passenger ID</th><th>Flight</th><th>Status</th></tr></thead>
              <tbody>
                <tr v-for="booking in searchedAdminBookings" :key="booking.id">
                  <td>{{ booking.pnr }}</td><td>{{ booking.passenger_name || booking.user?.name || '—' }}</td>
                  <td>{{ booking.passenger_id ?? '—' }}</td><td>{{ booking.flight_number || '—' }}</td><td>{{ booking.booking_status || '—' }}</td>
                </tr>
                <tr v-if="searchedAdminBookings.length === 0"><td colspan="5" class="empty-cell">{{ operationalSearch ? 'No matching PNR or passenger ID.' : 'No bookings returned by the admin API.' }}</td></tr>
              </tbody>
            </table>
          </div>
          <div v-if="searchedAdminPassengers.length" class="native-record-list">
            <strong>Passenger ID matches</strong>
            <div v-for="passenger in searchedAdminPassengers" :key="passenger.id">
            #{{ passenger.id }} · {{ passenger.full_name }} · {{ passenger.email }}
            </div>
          </div>
          <p class="panel-hint">
            <router-link to="/register">Passenger registration</router-link>
            <span aria-hidden="true"> · </span>
            <router-link to="/admin/passengers">Passenger information management</router-link>
          </p>
        </div>
        <p v-if="!authStore.isAdmin" class="panel-hint operational-links">
          <router-link to="/register">Passenger registration</router-link>
          <span aria-hidden="true"> · </span>
          <router-link to="/admin/passengers">Passenger information management</router-link>
        </p>
        </div>

        <!-- 5-Subject Architectural Topology -->
        <div class="content-panel">
          <div class="panel-header">
            <div>
              <h3>Unified Academic Architecture Topology</h3>
              <p class="panel-hint">Academic data is demo unless explicitly marked as output from the native C++ adapter.</p>
            </div>
            <span class="badge-source">4 Coursework Subjects</span>
          </div>
          <div class="topology-grid">
            <div class="topo-card" v-for="mod in moduleOverviews" :key="mod.title">
              <div class="topo-icon" :style="{ background: mod.color + '22', color: mod.color }">{{ mod.icon }}</div>
              <h4>{{ mod.title }}</h4>
              <span class="topo-code">{{ mod.subject }}</span>
              <p>{{ mod.desc }}</p>
              <div class="topo-files">
                <code v-for="src in mod.sources" :key="src">{{ src }}</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- =================================================================== -->
      <!-- TAB 2: JAVA OOP & AIRLINE RESERVATION HUB                          -->
      <!-- =================================================================== -->
      <section v-show="activeMainTab === 'java'" class="tab-section">
        <div class="section-intro">
          <div>
            <h2>Java OOP &amp; Airline Reservation System (PSOOP / JDBC)</h2>
            <p class="subtitle">Browser-side academic simulation of Java concepts; it does not execute or modify the Java source model, which remains unchanged.</p>
          </div>
          <span class="badge-source">Academic demo · Java source unchanged</span>
        </div>

        <div class="two-col-layout">
          <!-- PNR & Booking Generator Card -->
          <div class="content-panel">
            <div class="panel-header">
              <div>
                <h3>Interactive PNR &amp; Booking Generator</h3>
                <p class="panel-hint">Local demo of PNR and booking concepts; this panel does not execute Java source.</p>
              </div>
            </div>

            <div class="generator-box">
              <div class="pnr-display-area">
                <span class="pnr-title">GENERATED PNR (6-CHAR ALPHANUMERIC)</span>
                <span class="pnr-highlight">{{ activePNR }}</span>
                <button class="btn btn-outline btn-sm" @click="generateNewPNR">🎲 Re-generate PNR</button>
              </div>

              <form @submit.prevent="createJavaBooking" class="booking-form">
                <div class="form-row">
                  <div class="form-group">
                    <label>Passenger Name</label>
                    <input v-model="bookingForm.name" required placeholder="e.g. Aarav Sharma" class="form-input" />
                  </div>
                  <div class="form-group">
                    <label>Flight Number</label>
                    <select v-model="bookingForm.flight" class="form-input">
                      <option v-for="f in availableFlights" :key="f.flightNumber" :value="f.flightNumber">
                        {{ f.flightNumber }} ({{ f.from }} → {{ f.to }})
                      </option>
                    </select>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Seat Number</label>
                    <input v-model="bookingForm.seat" required placeholder="e.g. 1A, 5B, 12F" class="form-input" />
                  </div>
                  <div class="form-group">
                    <label>Cabin Class (Polymorphic SeatClass)</label>
                    <select v-model="bookingForm.cabinClass" class="form-input">
                      <option value="Economy">Economy (Priority 3, Multiplier 1.0x)</option>
                      <option value="Business">Business (Priority 2, Multiplier 1.8x)</option>
                      <option value="FirstClass">First Class (Priority 1, Multiplier 2.5x)</option>
                    </select>
                  </div>
                </div>

                <button type="submit" class="btn btn-primary btn-block">Confirm Booking &amp; Issue Ticket</button>
              </form>
            </div>
          </div>

          <!-- Compile-Time Method Overloading Demo -->
          <div class="content-panel">
            <div class="panel-header">
              <div>
                <h3>Compile-Time Polymorphism (Method Overloading)</h3>
                <p class="panel-hint">Simulates the 4 overloaded <code>Flight.calculateFare()</code> methods.</p>
              </div>
            </div>

            <div class="overload-simulator">
              <div class="form-group">
                <label>Base Fare (₹)</label>
                <input type="number" v-model.number="overloadParams.baseFare" class="form-input" />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Cabin Class</label>
                  <select v-model="overloadParams.cabinClass" class="form-input">
                    <option value="Economy">Economy (1.0x)</option>
                    <option value="Business">Business (1.8x)</option>
                    <option value="First Class">First Class (2.5x)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Baggage Weight (kg) [Allowance 15kg]</label>
                  <input type="number" v-model.number="overloadParams.baggageKg" class="form-input" />
                </div>
              </div>

              <div class="form-group">
                <label>Promo Code (10% Off)</label>
                <input v-model="overloadParams.promoCode" placeholder="Enter FLYAI10" class="form-input" />
              </div>

              <div class="overload-cards">
                <div class="overload-res-card">
                  <span class="code-method">1. calculateFare()</span>
                  <strong>₹{{ overloadResults.overload1.toLocaleString() }}</strong>
                  <small>Standard Base Fare</small>
                </div>
                <div class="overload-res-card">
                  <span class="code-method">2. calculateFare(class)</span>
                  <strong>₹{{ overloadResults.overload2.toLocaleString() }}</strong>
                  <small>Cabin Class Multiplier</small>
                </div>
                <div class="overload-res-card">
                  <span class="code-method">3. calculateFare(class, baggage)</span>
                  <strong>₹{{ overloadResults.overload3.toLocaleString() }}</strong>
                  <small>Class + Surcharge (₹500/kg >15kg)</small>
                </div>
                <div class="overload-res-card highlight">
                  <span class="code-method">4. calculateFare(class, baggage, promo)</span>
                  <strong class="text-green">₹{{ overloadResults.overload4.toLocaleString() }}</strong>
                  <small>Final with Promo Code</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Active Java Bookings List with Cancellation & Boarding Priority -->
        <div class="content-panel">
          <div class="panel-header">
            <div>
              <h3>Active Bookings &amp; Priority Boarding Order</h3>
              <p class="panel-hint">Managed via <code>BookingSystem.BookingStore</code> and <code>PassengerSorter.sortForBoarding()</code>.</p>
            </div>
            <button class="btn btn-outline btn-sm" @click="sortBookingsForBoarding">
              Sort by Boarding Priority (Class + Seat)
            </button>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>PNR</th>
                  <th>Passenger</th>
                  <th>Flight</th>
                  <th>Seat</th>
                  <th>Class (Priority)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="b in javaBookings" :key="b.pnr">
                  <td class="bold-text code-font"><span class="pnr-badge">{{ b.pnr }}</span></td>
                  <td><strong>{{ b.passengerName }}</strong></td>
                  <td><span class="flight-tag">{{ b.flightNumber }}</span></td>
                  <td><span class="seat-badge">{{ b.seatNumber }}</span></td>
                  <td>
                    <span :class="['class-chip', b.bookingClass.toLowerCase()]">
                      {{ b.bookingClass }} (P{{ b.priority }})
                    </span>
                  </td>
                  <td>
                    <span :class="['status-chip', b.status === 'CONFIRMED' ? 'green' : 'red']">{{ b.status }}</span>
                  </td>
                  <td>
                    <button
                      v-if="b.status === 'CONFIRMED'"
                      class="btn btn-danger btn-xs"
                      @click="cancelJavaBooking(b.pnr)"
                    >
                      Cancel Booking
                    </button>
                    <span v-else class="text-muted">Cancelled</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Swing FlightStatusForm & CSV Persistence Inspector -->
        <div class="two-col-layout">
          <!-- Swing Flight Status Simulator -->
          <div class="content-panel">
            <div class="panel-header">
              <div>
                <h3>Desktop Swing GUI Interaction Demo</h3>
                <p class="panel-hint">Browser simulation of the <code>FlightStatusForm.java</code> interface; it does not connect to a database.</p>
              </div>
            </div>

            <div class="swing-window-mockup">
              <div class="swing-title-bar">
                <span class="swing-dot red"></span>
                <span class="swing-dot yellow"></span>
                <span class="swing-dot green"></span>
                <span class="swing-title">Flight Status Update (UI Demo)</span>
              </div>
              <div class="swing-body">
                <div class="swing-field">
                  <label>Flight No:</label>
                  <input v-model="swingForm.flightNo" class="swing-input" placeholder="e.g. DEMO-001" />
                </div>
                <div class="swing-field">
                  <label>Destination:</label>
                  <input v-model="swingForm.destination" class="swing-input" placeholder="e.g. Mumbai" />
                </div>
                <div class="swing-field">
                  <label>Status:</label>
                  <select v-model="swingForm.status" class="swing-input">
                    <option value="On Time">On Time</option>
                    <option value="Delayed">Delayed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Boarding">Boarding</option>
                    <option value="Departed">Departed</option>
                  </select>
                </div>
                <div class="swing-buttons">
                  <button class="btn swing-btn" @click="handleSwingAdd">Add Flight</button>
                  <button class="btn swing-btn" @click="handleSwingUpdate">Update Status</button>
                  <button class="btn swing-btn" @click="handleSwingView">View All</button>
                </div>
                <div class="swing-textarea">
                  <pre>{{ swingTerminalOutput }}</pre>
                </div>
              </div>
            </div>
          </div>

          <!-- File Handling (CSV Viewer) -->
          <div class="content-panel">
            <div class="panel-header">
              <div>
                <h3>File Handling (BookingFileManager.java)</h3>
                <p class="panel-hint">Persistent serialization into <code>bookings.csv</code> with corruption checking.</p>
              </div>
            </div>
            <div class="csv-viewer">
              <div class="csv-header-bar">
                <span>FILE: java-oop/bookings.csv</span>
                <span class="records-count">{{ javaBookings.length }} records</span>
              </div>
              <pre class="csv-content">PNR,PASSENGER_NAME,FLIGHT_NUMBER,SEAT_NUMBER,CLASS,STATUS
<span v-for="b in javaBookings" :key="b.pnr">{{ b.pnr }},"{{ b.passengerName }}",{{ b.flightNumber }},{{ b.seatNumber }},{{ b.bookingClass }},{{ b.status }}
</span></pre>
            </div>
          </div>
        </div>

        <!-- 4. Generic Repository Architecture (repository/GenericRepository.java) -->
        <div class="content-panel">
          <div class="panel-header">
            <div>
              <h3>Generic Repository Architecture (GenericRepository&lt;T, ID&gt;)</h3>
              <span class="badge-algo">repository/GenericRepository.java</span>
              <p class="panel-hint">Enterprise Java Generics providing type-safe CRUD operations, lambda predicates, and O(1) in-memory storage.</p>
            </div>
            <span class="badge-source">java-oop/src/repository/</span>
          </div>

          <div class="repo-demo-grid">
            <div class="repo-actions-box">
              <label>Select Operation Contract:</label>
              <div class="repo-buttons-row">
                <button class="btn btn-sm" :class="activeRepoOp === 'findById' ? 'btn-primary' : 'btn-outline'" @click="activeRepoOp = 'findById'">
                  findById(ID id)
                </button>
                <button class="btn btn-sm" :class="activeRepoOp === 'findByFlight' ? 'btn-primary' : 'btn-outline'" @click="activeRepoOp = 'findByFlight'">
                  findByFlightNumber(flight)
                </button>
                <button class="btn btn-sm" :class="activeRepoOp === 'save' ? 'btn-primary' : 'btn-outline'" @click="activeRepoOp = 'save'">
                  save(T entity)
                </button>
                <button class="btn btn-sm" :class="activeRepoOp === 'deleteById' ? 'btn-primary' : 'btn-outline'" @click="activeRepoOp = 'deleteById'">
                  deleteById(ID id)
                </button>
              </div>

              <div class="repo-interactive-form">
                <div v-if="activeRepoOp === 'findById'" class="input-inline">
                  <input v-model="repoQueryPnr" placeholder="Enter PNR to lookup" class="form-input sm" />
                  <button class="btn btn-primary btn-sm" @click="executeRepoLookup">Query findById()</button>
                </div>
                <div v-else-if="activeRepoOp === 'findByFlight'" class="input-inline">
                  <select v-model="repoQueryFlight" class="form-input sm">
                    <option value="AI101">AI101</option>
                    <option value="AI202">AI202</option>
                    <option value="AI303">AI303</option>
                  </select>
                  <button class="btn btn-primary btn-sm" @click="executeRepoFilter">Filter via Predicate Stream</button>
                </div>
                <div v-else-if="activeRepoOp === 'save'" class="input-inline">
                  <input v-model="newRepoPassengerName" placeholder="Passenger Name" class="form-input sm" />
                  <input v-model="newRepoSeat" placeholder="Seat e.g. 5A" class="form-input sm narrow" />
                  <button class="btn btn-primary btn-sm" @click="executeRepoSave">Invoke save(Booking)</button>
                </div>
                <div v-else-if="activeRepoOp === 'deleteById'" class="input-inline">
                  <input v-model="repoDeletePnr" placeholder="PNR to delete" class="form-input sm" />
                  <button class="btn btn-danger btn-sm" @click="executeRepoDelete">Execute deleteById()</button>
                </div>
              </div>
            </div>

            <div class="repo-console-output">
              <span class="reg-label">GENERIC REPOSITORY LOG TRACE:</span>
              <pre class="repo-log">{{ repoConsoleTrace }}</pre>
            </div>
          </div>
        </div>

        <!-- 4. File Save and Load for Bookings (BookingFileService.java) -->
        <div class="content-panel">
          <div class="panel-header">
            <div>
              <h3>Booking File I/O Persistence (CSV &amp; Binary Serialization)</h3>
              <span class="badge-algo">service/BookingFileService.java &amp; util/BookingFileManager.java</span>
              <p class="panel-hint">Atomic file writes with temporary buffers, RFC 4180 standard CSV roundtrips, and binary object serialization.</p>
            </div>
            <div class="header-actions">
              <button class="btn btn-outline btn-xs" @click="exportBookingsToCsv">Generate CSV</button>
              <button class="btn btn-outline btn-xs" @click="downloadCsvFile">Download .csv</button>
              <button class="btn btn-primary btn-xs" @click="importBookingsFromCsv">Load from CSV</button>
            </div>
          </div>

          <div class="file-io-grid">
            <div class="file-editor-box">
              <label>Active CSV File Buffer (RFC 4180 Format):</label>
              <textarea v-model="csvFileContent" class="file-textarea" rows="6" placeholder="CSV content appears here..."></textarea>
              <div v-if="fileStatusMessage" class="form-feedback" style="margin-top: 6px;">{{ fileStatusMessage }}</div>
            </div>

            <div class="file-info-box">
              <h4>I/O Engine Features:</h4>
              <ul class="file-features-list">
                <li><strong>Atomic File Commit:</strong> Writes to temporary <code>bookings_*.tmp</code> buffer then moves atomically to prevent partial corruption.</li>
                <li><strong>Corrupt Row Resilience:</strong> Malformed rows missing fields or invalid numeric fares are logged to standard error and safely bypassed.</li>
                <li><strong>Dual Format Support:</strong> Human-readable RFC 4180 CSV export as well as compact Java binary <code>.dat</code> stream.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- =================================================================== -->
      <!-- TAB 3: DATA STRUCTURES (DS) INTERACTIVE LABORATORY                  -->
      <!-- =================================================================== -->
      <section v-show="activeMainTab === 'ds'" class="tab-section">
        <div class="section-intro">
          <div>
            <h2>Data Structures &amp; Algorithms Laboratory (C++ DS)</h2>
            <p class="subtitle">The interactive browser examples below are demo state. The Native C++ Output panel separately displays results returned by the native adapter.</p>
          </div>
          <span class="badge-source">cpp-ds/src/</span>
        </div>

        <div class="content-panel native-output-panel">
          <div class="panel-header">
            <div>
              <h3>Native C++ Data-Structure Output <span class="badge-source">Native adapter</span></h3>
              <p class="panel-hint">Loaded from <code>GET /api/academic/cpp-demo</code>. Browser-only interactions below remain demo data.</p>
            </div>
            <button class="btn btn-outline btn-sm" @click="loadNativeDemo" :disabled="loadingNativeDemo">
              {{ loadingNativeDemo ? 'Loading…' : 'Refresh native output' }}
            </button>
          </div>
          <p v-if="nativeDemoError" class="form-feedback error" role="alert">{{ nativeDemoError }}</p>
          <p v-else-if="loadingNativeDemo" class="empty-cell">Loading native C++ output…</p>
          <div v-else-if="nativeDemo" class="native-output-grid">
            <article class="native-output-card">
              <h4>Passenger Array · {{ nativeDemo.passengerArray?.count ?? 0 }}</h4>
              <div class="table-responsive">
                <table class="data-table">
                  <thead><tr><th>PNR</th><th>Name</th><th>Age</th><th>Gender</th><th>Contact</th><th>Seat</th><th>Class</th></tr></thead>
                  <tbody>
                    <tr v-for="record in nativeDemo.passengerArray?.records || []" :key="record.pnr">
                      <td>{{ record.pnr }}</td><td>{{ record.name }}</td><td>{{ record.age }}</td><td>{{ record.gender }}</td>
                      <td>{{ maskNativeContact(record.contact) }}</td><td>{{ record.seatNo }}</td><td>{{ record.travelClass }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </article>
            <article class="native-output-card">
              <h4>Seat Map · {{ nativeDemo.seatMap?.rows }} × {{ nativeDemo.seatMap?.columns }}</h4>
              <p class="panel-hint">
                Available {{ nativeDemo.seatMap?.counts?.available ?? 0 }} ·
                Booked {{ nativeDemo.seatMap?.counts?.booked ?? 0 }} ·
                Blocked {{ nativeDemo.seatMap?.counts?.blocked ?? 0 }}
              </p>
              <div class="native-seat-map">
                <div v-for="(row, rowIndex) in nativeDemo.seatMap?.statuses || []" :key="rowIndex" class="native-seat-row">
                  <span v-for="(status, colIndex) in row" :key="`${rowIndex}-${colIndex}`" class="native-seat-cell" :title="`Row ${rowIndex + 1}, seat ${colIndex + 1}, status ${status}`">{{ status }}</span>
                </div>
              </div>
            </article>
            <article class="native-output-card">
              <h4>Waitlist · {{ nativeDemo.waitlist?.count ?? 0 }}</h4>
              <ul class="native-record-list">
                <li v-for="record in nativeDemo.waitlist?.records || []" :key="record.pnr">{{ record.pnr }} · {{ record.name }}</li>
              </ul>
            </article>
            <article class="native-output-card">
              <h4>PNR Hash Table</h4>
              <p>Records {{ nativeDemo.pnrHash?.count ?? 0 }} / {{ nativeDemo.pnrHash?.capacity ?? 0 }} · Collisions {{ nativeDemo.pnrHash?.collisions ?? 0 }} · Load factor {{ nativeDemo.pnrHash?.loadFactor ?? '—' }}</p>
              <p v-if="nativeDemo.pnrHash?.search">
                Search {{ nativeDemo.pnrHash.search.target }}:
                {{ nativeDemo.pnrHash.search.found ? 'found' : 'not found' }}
                ({{ nativeDemo.pnrHash.search.steps }} steps)
              </p>
              <p v-if="nativeDemo.pnrHash?.search?.record" class="panel-hint">
                {{ nativeDemo.pnrHash.search.record.pnr }} · {{ nativeDemo.pnrHash.search.record.name }}
                <span v-if="nativeDemo.pnrHash.search.record.seatNo"> · {{ nativeDemo.pnrHash.search.record.seatNo }}</span>
              </p>
            </article>
            <article class="native-output-card">
              <h4>Linear vs Binary Search · {{ nativeDemo.searchComparison?.datasetSize ?? 0 }} records</h4>
              <p>Target: {{ nativeDemo.searchComparison?.targetPnr ?? '—' }}</p>
              <p>Linear: {{ nativeDemo.searchComparison?.linear?.found ? 'found' : 'not found' }} at {{ nativeDemo.searchComparison?.linear?.index ?? '—' }} · {{ nativeDemo.searchComparison?.linear?.comparisons ?? 0 }} comparisons</p>
              <p>Binary: {{ nativeDemo.searchComparison?.binary?.found ? 'found' : 'not found' }} at {{ nativeDemo.searchComparison?.binary?.index ?? '—' }} · {{ nativeDemo.searchComparison?.binary?.comparisons ?? 0 }} comparisons</p>
            </article>
            <article class="native-output-card">
              <h4>Sort Demonstration</h4>
              <pre class="native-sort-output">{{ nativeDemo.sortDemo?.text || 'No sort output returned.' }}</pre>
            </article>
          </div>
          <p v-else class="empty-cell">Native output is not available yet. Use “Refresh native output” to retry.</p>
        </div>

        <!-- DS Algorithms Grid -->
        <div class="two-col-layout">

          <!-- 1. Circular Boarding Queue -->
          <div class="content-panel">
            <div class="panel-header">
              <div>
                <h3>Circular Boarding Queue</h3>
                <span class="badge-algo">BoardingQueueCircular.cpp</span>
                <p class="panel-hint">Modulo arithmetic wrapping: <code>rear = (rear + 1) % capacity</code>.</p>
              </div>
            </div>

            <div class="ds-lab-card">
              <div class="circular-queue-visual">
                <div class="ring-slots">
                  <div
                    v-for="(slot, idx) in circularQueue.slots"
                    :key="idx"
                    :class="['queue-slot', {
                      occupied: slot !== null,
                      isFront: idx === circularQueue.front && circularQueue.count > 0,
                      isRear: idx === circularQueue.rear && !circularQueueIsFull
                    }]"
                  >
                    <span class="slot-idx">#{{ idx }}</span>
                    <strong v-if="slot" class="slot-val">{{ slot.name }}<br><small>G{{ slot.group }}</small></strong>
                    <span v-else class="slot-empty">Empty</span>
                    <div class="slot-labels">
                      <span v-if="idx === circularQueue.front && circularQueue.count > 0" class="ptr-tag front-tag">FRONT</span>
                      <span v-if="idx === circularQueue.rear" class="ptr-tag rear-tag">REAR</span>
                    </div>
                  </div>
                </div>

                <div class="queue-status-bar">
                  <span>Front: <strong>{{ circularQueue.front }}</strong></span>
                  <span>Rear: <strong>{{ circularQueue.rear }}</strong></span>
                  <span>Count: <strong>{{ circularQueue.count }} / {{ circularQueue.capacity }}</strong></span>
                  <span :class="['queue-badge', circularQueueIsFull ? 'red' : 'green']">
                    {{ circularQueueIsFull ? 'FULL' : circularQueue.count === 0 ? 'EMPTY' : 'AVAILABLE' }}
                  </span>
                </div>

                <div class="queue-controls">
                  <div class="input-inline">
                    <input v-model="newQueuePassenger.name" placeholder="Passenger Name" class="form-input sm" />
                    <input type="number" v-model.number="newQueuePassenger.group" placeholder="Group (1-4)" min="1" max="4" class="form-input sm narrow" />
                    <button class="btn btn-primary btn-sm" @click="enqueuePassenger" :disabled="circularQueueIsFull">Enqueue</button>
                  </div>
                  <button class="btn btn-danger btn-sm" @click="dequeuePassenger" :disabled="circularQueue.count === 0">Dequeue Front</button>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. Priority Check-In Deque -->
          <div class="content-panel">
            <div class="panel-header">
              <div>
                <h3>Priority Check-In Deque (Double-Ended Queue)</h3>
                <span class="badge-algo">Checkindeque</span>
                <p class="panel-hint">Priority insertion: Elderly/VIP at FRONT, Normal at REAR.</p>
              </div>
            </div>

            <div class="ds-lab-card">
              <div class="deque-mode-selector">
                <label>Operating Mode:</label>
                <div class="radio-pill-group">
                  <button
                    v-for="m in dequeModes"
                    :key="m.value"
                    :class="['btn-pill', { active: currentDequeMode === m.value }]"
                    @click="currentDequeMode = m.value"
                  >
                    {{ m.label }}
                  </button>
                </div>
              </div>

              <div class="deque-display">
                <div class="deque-end-label">FRONT (High Priority)</div>
                <div class="deque-items-row">
                  <div v-for="(p, i) in dequeList" :key="p.pnr || i" class="deque-item" :class="p.category.toLowerCase()">
                    <span class="category-badge">{{ p.category }}</span>
                    <strong>{{ p.name }}</strong>
                    <small>Age: {{ p.age }} | {{ p.pnr }}</small>
                  </div>
                  <div v-if="dequeList.length === 0" class="empty-deque">Queue is Empty</div>
                </div>
                <div class="deque-end-label">REAR (Standard)</div>
              </div>

              <div class="deque-actions-panel">
                <div class="input-inline">
                  <input v-model="newDequePassenger.name" placeholder="Name" class="form-input sm" />
                  <input type="number" v-model.number="newDequePassenger.age" placeholder="Age" class="form-input sm narrow" />
                  <select v-model="newDequePassenger.category" class="form-input sm">
                    <option value="NORMAL">Normal</option>
                    <option value="ELDERLY">Elderly (&ge;60)</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
                <div class="deque-btn-row">
                  <button class="btn btn-outline btn-sm" @click="insertDequeFront" :disabled="currentDequeMode === 'INPUT_RESTRICTED' || dequeList.length >= 6">
                    + Insert Front
                  </button>
                  <button class="btn btn-primary btn-sm" @click="insertDequeRear" :disabled="dequeList.length >= 6">
                    + Insert Rear
                  </button>
                  <button class="btn btn-danger btn-sm" @click="deleteDequeFront" :disabled="dequeList.length === 0">
                    - Serve Front
                  </button>
                  <button class="btn btn-outline btn-sm" @click="deleteDequeRear" :disabled="currentDequeMode === 'OUTPUT_RESTRICTED' || dequeList.length === 0">
                    - Remove Rear
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="two-col-layout">
          <!-- 3. Seat Selection Undo Stack -->
          <div class="content-panel">
            <div class="panel-header">
              <div>
                <h3>Seat Selection Undo Stack (LIFO)</h3>
                <span class="badge-algo">undostack.cpp</span>
                <p class="panel-hint">Array-backed stack recording seat actions ('S' = Selected, 'C' = Cancelled).</p>
              </div>
            </div>

            <div class="ds-lab-card">
              <div class="stack-layout">
                <!-- 30-Seat Interactive Grid -->
                <div class="seat-mini-grid">
                  <span class="grid-title">Click seat to select / cancel:</span>
                  <div class="seats-30-container">
                    <button
                      v-for="seatNum in 30"
                      :key="seatNum"
                      :class="['mini-seat-btn', { selected: seatStackStates[seatNum] }]"
                      @click="toggleStackSeat(seatNum)"
                    >
                      {{ seatNum }}
                    </button>
                  </div>
                </div>

                <!-- Vertical Stack Visualizer -->
                <div class="stack-visualizer">
                  <div class="stack-top-header">
                    <span>STACK TOP ({{ stackItems.length }}/50)</span>
                    <button class="btn btn-warning btn-xs" @click="popStackUndo" :disabled="stackItems.length === 0">
                      ↺ UNDO Last Action
                    </button>
                  </div>
                  <div class="stack-tube">
                    <div v-for="(act, idx) in stackItemsReversed" :key="idx" class="stack-item-card">
                      <span class="stack-action-type" :class="act.type">{{ act.type === 'S' ? 'SELECT' : 'CANCEL' }}</span>
                      <strong>Seat #{{ act.seat }}</strong>
                    </div>
                    <div v-if="stackItems.length === 0" class="empty-tube">Stack is Empty</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 4. Manifest Merge Doubly Linked List -->
          <div class="content-panel">
            <div class="panel-header">
              <div>
                <h3>Manifest Merge Doubly Linked List</h3>
                <span class="badge-algo">ManifestMergeDLL.cpp</span>
                <p class="panel-hint">Merges two sorted boarding-group manifests ordered by alphanumeric seat number.</p>
              </div>
            </div>

            <div class="ds-lab-card">
              <div class="manifest-split-view">
                <div class="manifest-column">
                  <span class="manifest-tag">Group A (First/Business)</span>
                  <div class="dll-nodes">
                    <div v-for="node in manifestGroupA" :key="node.pnr" class="dll-node-card">
                      <strong>{{ node.name }}</strong>
                      <span class="seat-tag">{{ node.seat }}</span>
                    </div>
                  </div>
                </div>

                <div class="manifest-column">
                  <span class="manifest-tag">Group B (Economy)</span>
                  <div class="dll-nodes">
                    <div v-for="node in manifestGroupB" :key="node.pnr" class="dll-node-card">
                      <strong>{{ node.name }}</strong>
                      <span class="seat-tag">{{ node.seat }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="manifest-action">
                <button class="btn btn-primary btn-block" @click="executeManifestMerge">
                  Merge Lists with <code>seatComesBefore()</code> Comparator
                </button>
              </div>

              <div v-if="mergedManifest.length > 0" class="merged-result-box">
                <span class="merged-title">FINAL SORTED MASTER MANIFEST:</span>
                <div class="merged-nodes-chain">
                  <div v-for="(node, idx) in mergedManifest" :key="node.pnr" class="chain-node">
                    <span class="node-arrow" v-if="idx > 0">⇄</span>
                    <div class="chain-content">
                      <strong>{{ node.seat }}</strong>
                      <small>{{ node.name }}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 5. PNR Hash Table with Collision Handling (Separate Chaining) -->
        <div class="content-panel">
          <div class="panel-header">
            <div>
              <h3>PNR Hash Table with Collision Handling (Separate Chaining)</h3>
              <span class="badge-algo">cpp-ds/src/PNRHashTable.cpp</span>
              <p class="panel-hint">Polynomial rolling hash with prime modulo (capacity = 7). Visualizes collision linked lists and O(1) average lookup.</p>
            </div>
            <div class="hash-metrics-chips">
              <span class="flag-chip set">Capacity: {{ hashTableCapacity }} Buckets</span>
              <span class="flag-chip set">Records: {{ hashTableRecordsCount }}</span>
              <span class="flag-chip" :class="{ set: hashTableCollisionCount > 0 }">Collisions: {{ hashTableCollisionCount }}</span>
              <span class="flag-chip set">Load Factor (λ): {{ (hashTableRecordsCount / hashTableCapacity).toFixed(2) }}</span>
            </div>
          </div>

          <div class="hash-table-visualizer">
            <div class="hash-buckets-list">
              <div v-for="(bucket, bIdx) in hashTableBuckets" :key="bIdx" class="hash-bucket-row">
                <span class="bucket-idx-badge">Bucket [{{ bIdx }}]</span>
                <div class="bucket-chain">
                  <template v-if="bucket.length === 0">
                    <span class="empty-bucket-tag">-- (empty)</span>
                  </template>
                  <template v-else>
                    <div v-for="(node, nIdx) in bucket" :key="node.pnr" class="hash-chain-node">
                      <span v-if="nIdx > 0" class="chain-arrow">&rarr;</span>
                      <div class="hash-node-box" :class="{ collision: nIdx > 0 }">
                        <strong>{{ node.pnr }}</strong>
                        <small>{{ node.name }} ({{ node.flight }} {{ node.seat }})</small>
                      </div>
                    </div>
                    <span class="chain-arrow">&rarr;</span>
                    <span class="chain-null">NULL</span>
                  </template>
                </div>
              </div>
            </div>

            <div class="hash-search-panel">
              <div class="input-inline">
                <input v-model="hashSearchQuery" placeholder="Search PNR (e.g. BL9X33, PNR101, SK7M41)" class="form-input sm" />
                <button class="btn btn-primary btn-sm" @click="executeHashSearch">Search Table O(1)</button>
              </div>
              <p v-if="hashSearchResult" class="form-feedback" style="margin-top: 8px;">{{ hashSearchResult }}</p>
            </div>
          </div>
        </div>

        <!-- 5. Binary Search vs Linear Search Live Comparison -->
        <div class="content-panel">
          <div class="panel-header">
            <div>
              <h3>Binary Search vs Linear Search Comparison</h3>
              <span class="badge-algo">cpp-ds/src/SearchComparison.cpp</span>
              <p class="panel-hint">Side-by-side benchmark: Linear Search O(n) sequential scan vs Binary Search O(log n) divide-and-conquer on sorted PNR records.</p>
            </div>
            <div class="header-actions">
              <div class="input-inline">
                <input v-model="searchBenchmarkQuery" placeholder="Search PNR (e.g. SK7M41, PNR101, HY5V12)" class="form-input sm" />
                <button class="btn btn-primary btn-sm" @click="executeSearchComparison">Compare Algorithms</button>
              </div>
            </div>
          </div>

          <div class="search-compare-grid">
            <!-- Linear Search Card -->
            <div class="search-card">
              <div class="search-card-header">
                <h4>Linear Search (Sequential Scan)</h4>
                <span class="badge-source">O(n) Time | O(1) Space</span>
              </div>
              <div class="search-stats-row">
                <div class="search-stat">
                  <span>Status:</span>
                  <strong :class="linearSearchStats.found ? 'text-green' : 'text-red'">
                    {{ linearSearchStats.found ? 'FOUND at [' + linearSearchStats.index + ']' : 'NOT FOUND' }}
                  </strong>
                </div>
                <div class="search-stat">
                  <span>Comparisons:</span>
                  <strong>{{ linearSearchStats.comparisons }} comps</strong>
                </div>
                <div class="search-stat">
                  <span>Latency:</span>
                  <strong>{{ linearSearchStats.timeMicro }} µs</strong>
                </div>
              </div>
              <div class="search-trace-box">
                <span class="trace-label">Sequential Traversal Step Trace:</span>
                <ul class="trace-list">
                  <li v-for="(t, i) in linearSearchStats.trace" :key="i">{{ t }}</li>
                </ul>
              </div>
            </div>

            <!-- Binary Search Card -->
            <div class="search-card highlight">
              <div class="search-card-header">
                <h4>Binary Search (Divide &amp; Conquer)</h4>
                <span class="badge-source">O(log n) Time | O(1) Space</span>
              </div>
              <div class="search-stats-row">
                <div class="search-stat">
                  <span>Status:</span>
                  <strong :class="binarySearchStats.found ? 'text-green' : 'text-red'">
                    {{ binarySearchStats.found ? 'FOUND at [' + binarySearchStats.index + ']' : 'NOT FOUND' }}
                  </strong>
                </div>
                <div class="search-stat">
                  <span>Comparisons:</span>
                  <strong class="text-cyan">{{ binarySearchStats.comparisons }} comps</strong>
                </div>
                <div class="search-stat">
                  <span>Efficiency Gain:</span>
                  <strong class="text-gold">{{ (linearSearchStats.comparisons / Math.max(1, binarySearchStats.comparisons)).toFixed(1) }}x fewer</strong>
                </div>
              </div>
              <div class="search-trace-box">
                <span class="trace-label">Divide &amp; Conquer Interval Probing:</span>
                <ul class="trace-list">
                  <li v-for="(t, i) in binarySearchStats.trace" :key="i">{{ t }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- =================================================================== -->
      <!-- TAB 4: COA & COMPUTER ARCHITECTURE PANEL                            -->
      <!-- =================================================================== -->
      <section v-show="activeMainTab === 'coa'" class="tab-section">
        <div class="section-intro">
          <div>
            <h2>Computer Organization &amp; Architecture (COA &amp; Assembly)</h2>
            <p class="subtitle">Live occupancy from API seat data, alongside academic demos for threshold logic, 64-bit registers, BCD conversion, and the Control Unit cycle.</p>
          </div>
          <span class="badge-source">Academic demo · COA / Assembly</span>
        </div>

        <div class="two-col-layout">
          <!-- 1. Real-Time Hardware Seat Occupancy Monitor -->
          <div class="content-panel">
            <div class="panel-header">
              <div>
                <h3>API Seat Occupancy &amp; Threshold Detection <span class="badge-source">API / Supabase</span></h3>
                <p class="panel-hint">Live seat totals and integer occupancy are from the selected flight’s API seat inventory. Thresholds: &lt;75% OPEN | 75-89% RUNNING LOW | &ge;90% FULL.</p>
              </div>
            </div>

            <div class="coa-card">
              <div class="status-indicator-hero" :class="occupancyStatusClass">
                <div class="status-led" :class="occupancyStatusClass"></div>
                <div>
                  <span class="status-hero-label">SYSTEM HARDWARE STATUS</span>
                  <span class="status-hero-val">{{ hasSeatData ? occupancyStatus : 'NO API DATA' }}</span>
                </div>
                <div class="occupancy-large-percent">{{ hasSeatData ? `${occupancyPercentage}%` : '—' }}</div>
              </div>

              <div class="occupancy-stats-grid">
                <div class="stat-box">
                  <small>TOTAL SEATS</small>
                  <strong>{{ totalSeatsCount }}</strong>
                </div>
                <div class="stat-box green">
                  <small>AVAILABLE</small>
                  <strong>{{ totalSeatsCount - bookedSeatsCount - blockedSeatsCount }}</strong>
                </div>
                <div class="stat-box red">
                  <small>BOOKED</small>
                  <strong>{{ bookedSeatsCount }}</strong>
                </div>
                <div class="stat-box amber">
                  <small>BLOCKED (EXIT)</small>
                  <strong>{{ blockedSeatsCount }}</strong>
                </div>
              </div>

              <!-- Binary Bitmask Representation -->
              <div class="binary-register-box">
                <span class="reg-label">16-BIT BOOKED-SEAT COUNT DEMO ENCODING:</span>
                <span class="binary-string code-font">{{ seatRegisterBitmask }}</span>
                <small class="text-muted">A binary encoding of the live booked-seat count; not an individual seat allocation bitfield.</small>
              </div>
            </div>
          </div>

          <!-- 2. 64-bit Hardware Register Simulator (fare_calc_sim.cpp) -->
          <div class="content-panel">
            <div class="panel-header">
              <div>
                <h3>64-Bit Register ALU Simulator (x86-64 NASM)</h3>
                <span class="badge-algo">fare_calc_sim.cpp</span>
                <p class="panel-hint">Simulates hardware registers: <code>RAX = RAX + RBX - RCX</code>.</p>
              </div>
            </div>

            <div class="coa-card">
              <div class="registers-grid">
                <div class="register-card" :class="{ active: currentAluStep === 1 || currentAluStep >= 4 }">
                  <span class="reg-name">RAX (Accumulator)</span>
                  <span class="reg-value code-font">0x{{ raxRegister.toString(16).toUpperCase().padStart(8, '0') }}</span>
                  <span class="reg-dec">₹{{ raxRegister }}</span>
                  <small>Base Fare / Result</small>
                </div>
                <div class="register-card" :class="{ active: currentAluStep === 2 || currentAluStep === 4 }">
                  <span class="reg-name">RBX (Base Register)</span>
                  <span class="reg-value code-font">0x{{ rbxRegister.toString(16).toUpperCase().padStart(8, '0') }}</span>
                  <span class="reg-dec">₹{{ rbxRegister }}</span>
                  <small>Aviation Tax</small>
                </div>
                <div class="register-card" :class="{ active: currentAluStep === 3 || currentAluStep === 5 }">
                  <span class="reg-name">RCX (Counter Register)</span>
                  <span class="reg-value code-font">0x{{ rcxRegister.toString(16).toUpperCase().padStart(8, '0') }}</span>
                  <span class="reg-dec">₹{{ rcxRegister }}</span>
                  <small>Promo Discount</small>
                </div>
              </div>

              <!-- Flag Register State -->
              <div class="flags-register-row">
                <span class="flags-title">CPU STATUS FLAGS:</span>
                <div class="flags-pills">
                  <span class="flag-chip" :class="{ set: aluFlags.ZF }">ZF={{ aluFlags.ZF ? '1' : '0' }} (Zero)</span>
                  <span class="flag-chip" :class="{ set: aluFlags.CF }">CF={{ aluFlags.CF ? '1' : '0' }} (Carry)</span>
                  <span class="flag-chip" :class="{ set: aluFlags.SF }">SF={{ aluFlags.SF ? '1' : '0' }} (Sign)</span>
                  <span class="flag-chip" :class="{ set: aluFlags.OF }">OF={{ aluFlags.OF ? '1' : '0' }} (Overflow)</span>
                </div>
              </div>

              <!-- Step Execution Console -->
              <div class="alu-stepper-console">
                <div class="stepper-controls">
                  <button class="btn btn-outline btn-sm" @click="resetAluSimulation">↺ Reset Registers</button>
                  <button class="btn btn-primary btn-sm" @click="stepAluClock">▶ Clock Step Next Instruction</button>
                </div>
                <pre class="asm-terminal-log">{{ aluTerminalLog }}</pre>
              </div>
            </div>
          </div>
        </div>

        <!-- Hex to BCD & Control Unit -->
        <div class="two-col-layout">
          <!-- HexToBCD Converter -->
          <div class="content-panel">
            <div class="panel-header">
              <div>
                <h3>Hexadecimal to BCD Converter</h3>
                <span class="badge-algo">HexToBCD.asm</span>
                <p class="panel-hint">Converts 64-bit Hex to Packed and Unpacked Binary Coded Decimal.</p>
              </div>
            </div>

            <div class="coa-card">
              <div class="form-group">
                <label>Hexadecimal Value (e.g. 0x1A2B, 0xFF, 0x1000)</label>
                <input v-model="hexInput" placeholder="0x1A2B" class="form-input code-font" @input="convertHexToBcd" />
              </div>
              <div class="bcd-results-box">
                <div class="bcd-row">
                  <span>Decimal Equivalent:</span>
                  <strong class="code-font">{{ bcdConversion.decimal }}</strong>
                </div>
                <div class="bcd-row">
                  <span>Packed BCD:</span>
                  <strong class="code-font text-cyan">{{ bcdConversion.packedBcd }}</strong>
                </div>
                <div class="bcd-row">
                  <span>Unpacked BCD (Nibble Separated):</span>
                  <strong class="code-font text-green">{{ bcdConversion.unpackedBcd }}</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- Micro-Architectural Control Unit -->
          <div class="content-panel">
            <div class="panel-header">
              <div>
                <h3>Control Unit Instruction Cycle</h3>
                <span class="badge-algo">ControlUnit.java</span>
                <p class="panel-hint">Simulates hardware Fetch, Decode, and Execute cycles.</p>
              </div>
            </div>

            <div class="coa-card">
              <div class="cu-stages-chain">
                <div class="cu-stage" :class="{ active: cuStage === 'FETCH' }">
                  <span class="stage-tag">STAGE 1</span>
                  <strong>FETCH</strong>
                  <small>{{ currentCuInstruction.opcode }} {{ currentCuInstruction.op1 }}, {{ currentCuInstruction.op2 }}</small>
                </div>
                <div class="cu-stage" :class="{ active: cuStage === 'DECODE' }">
                  <span class="stage-tag">STAGE 2</span>
                  <strong>DECODE</strong>
                  <small>Opcode: {{ currentCuInstruction.opcode }}</small>
                </div>
                <div class="cu-stage" :class="{ active: cuStage === 'EXECUTE' }">
                  <span class="stage-tag">STAGE 3</span>
                  <strong>EXECUTE</strong>
                  <small>Result: {{ cuResult }}</small>
                </div>
              </div>

              <div class="cu-controls">
                <button class="btn btn-outline btn-sm" @click="advanceCuCycle">Step Control Unit Cycle</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Mapping Table: Airline Fare Operations to Processor Components -->
        <div class="content-panel">
          <div class="panel-header">
            <div>
              <h3>Mapping Table: Airline Fare Operations to Processor Hardware Components</h3>
              <span class="badge-algo">coa-nasm/FareOperationsProcessorMapping.md</span>
              <p class="panel-hint">Architectural mapping connecting discrete fare calculation operations to CPU execution units, registers, buses, and status flags.</p>
            </div>
            <span class="badge-source">coa-nasm/ &amp; assembly-component/</span>
          </div>

          <div class="table-responsive">
            <table class="data-table mapping-table">
              <thead>
                <tr>
                  <th>Stage</th>
                  <th>Fare Operation</th>
                  <th>Assembly Opcode</th>
                  <th>Primary Processor Component</th>
                  <th>Secondary Component</th>
                  <th>Bus &amp; Datapath Activity</th>
                  <th>Flags Affected</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="st in processorMappingSteps" :key="st.stage">
                  <td class="bold-text">#{{ st.stage }}</td>
                  <td><strong>{{ st.operation }}</strong></td>
                  <td><code class="flight-tag">{{ st.asm }}</code></td>
                  <td><strong class="text-cyan">{{ st.primaryComponent }}</strong></td>
                  <td>{{ st.secondaryComponent }}</td>
                  <td class="code-font" style="font-size: 11px;">{{ st.busActivity }}</td>
                  <td><span class="flag-chip" :class="{ set: st.flags !== 'None' }">{{ st.flags }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 3. Control-Flow Demo: Seat-Availability Branches & Branch Prediction -->
        <div class="content-panel">
          <div class="panel-header">
            <div>
              <h3>Seat-Availability Control Flow &amp; CPU Branch Prediction</h3>
              <span class="badge-algo">coa-nasm/seat_availability_branches.asm</span>
              <p class="panel-hint">Hardware condition evaluation: CMP instructions, ALU flags (ZF, CF, SF), and 2-bit dynamic saturating counter branch prediction.</p>
            </div>
            <div class="header-actions">
              <span class="flag-chip set">Predictor: {{ branchPredictorState }}</span>
            </div>
          </div>

          <div class="branch-demo-layout">
            <div class="branch-controls-box">
              <label>Simulate Occupancy Percentage: <strong>{{ branchOccupancySlider }}%</strong></label>
              <input type="range" v-model.number="branchOccupancySlider" min="0" max="100" class="branch-range" />
              <div class="branch-metrics-pills">
                <span class="flag-chip">Total: {{ branchEvaluationTrace.total }}</span>
                <span class="flag-chip">Booked: {{ branchEvaluationTrace.booked }}</span>
                <span class="flag-chip">Blocked: {{ branchEvaluationTrace.blocked }}</span>
                <span class="flag-chip set">Available: {{ branchEvaluationTrace.avail }}</span>
              </div>
            </div>

            <div class="branch-stages-flow">
              <div v-for="stg in branchEvaluationTrace.stages" :key="stg.stage" class="branch-stage-card" :class="{ 'penalty-miss': !stg.hit }">
                <div class="branch-stage-top">
                  <span class="badge-source">Stage {{ stg.stage }}</span>
                  <code>{{ stg.asm }}</code>
                  <span class="flags-badge">{{ stg.flags }}</span>
                </div>
                <div class="branch-stage-body">
                  <p><strong>Evaluation:</strong> {{ stg.desc }}</p>
                  <div class="prediction-row">
                    <span>Predicted: <strong>{{ stg.predicted }}</strong></span>
                    <span>Actual: <strong>{{ stg.actual }}</strong></span>
                    <span :class="stg.hit ? 'text-green' : 'text-red'">
                      {{ stg.hit ? '✓ PREDICTION HIT (+0 cycles)' : '✕ MISPREDICTION (+3 cycle stall)' }}
                    </span>
                  </div>
                  <p class="action-text">{{ stg.action }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- =================================================================== -->
      <!-- TAB 5: COMPUTER GRAPHICS (CG) VISUALIZATION SUITE                   -->
      <!-- =================================================================== -->
      <section v-show="activeMainTab === 'cg'" class="tab-section">
        <div class="section-intro">
          <div>
            <h2>Computer Graphics Browser Demo (Native C++ Coursework)</h2>
            <p class="subtitle">Aircraft glyphs, cabin seat matrices, material lighting, Bresenham rasterization, Cohen-Sutherland clipping, and a rotating aircraft are rendered in the browser; native C++ coursework sources are referenced, not executed here.</p>
          </div>
          <span class="badge-source">Academic demo · C++ CG / CGL</span>
        </div>

        <!-- 3D Aircraft Model Viewer (Aircraft3D.cpp & AircraftProjectionViewing.cpp) -->
        <div class="content-panel">
          <div class="panel-header">
            <div>
              <h3>Interactive 3D Aircraft Model: Projection &amp; Viewing Pipeline</h3>
              <span class="badge-algo">Aircraft3D.cpp &amp; AircraftProjectionViewing.cpp</span>
              <p class="panel-hint">Switch between Orthographic parallel rays (glOrtho) and Perspective foreshortening (gluPerspective), with multi-view architectural camera presets.</p>
            </div>
            <div class="header-actions">
              <div class="btn-group">
                <button class="btn btn-xs" :class="active3DProjectionMode === 'PERSPECTIVE' ? 'btn-primary' : 'btn-outline'" @click="active3DProjectionMode = 'PERSPECTIVE'">
                  Perspective
                </button>
                <button class="btn btn-xs" :class="active3DProjectionMode === 'ORTHOGRAPHIC' ? 'btn-primary' : 'btn-outline'" @click="active3DProjectionMode = 'ORTHOGRAPHIC'">
                  Orthographic (glOrtho)
                </button>
              </div>
              <button class="btn btn-outline btn-xs" @click="reset3DCamera">Reset View</button>
              <button class="btn btn-primary btn-xs" @click="autoRotate3D = !autoRotate3D">
                {{ autoRotate3D ? 'Stop Auto-Rotate' : 'Start Auto-Rotate' }}
              </button>
            </div>
          </div>

          <!-- Multi-view Architectural Camera Presets Toolbar -->
          <div class="preset-view-toolbar">
            <span class="toolbar-label">Architectural Multi-View (glOrtho):</span>
            <button class="btn btn-xs" :class="active3DCameraPreset === 'PLAN' ? 'btn-primary' : 'btn-outline'" @click="apply3DPreset('PLAN')">
              Top / Plan (Cabin Seating)
            </button>
            <button class="btn btn-xs" :class="active3DCameraPreset === 'FRONT' ? 'btn-primary' : 'btn-outline'" @click="apply3DPreset('FRONT')">
              Front Elevation (Nose &amp; Wings)
            </button>
            <button class="btn btn-xs" :class="active3DCameraPreset === 'SIDE' ? 'btn-primary' : 'btn-outline'" @click="apply3DPreset('SIDE')">
              Side Profile (Fuselage &amp; Rudder)
            </button>
            <button class="btn btn-xs" :class="active3DCameraPreset === 'ISO' ? 'btn-primary' : 'btn-outline'" @click="apply3DPreset('ISO')">
              Isometric Axonometric (Technical)
            </button>
            <button class="btn btn-xs" :class="active3DCameraPreset === 'FREE' ? 'btn-primary' : 'btn-outline'" @click="apply3DPreset('FREE')">
              Free 3D Orbit
            </button>
          </div>

          <div class="canvas-3d-wrapper">
            <canvas ref="canvas3DRef" width="900" height="420" class="canvas-3d"></canvas>
            <div class="canvas-3d-controls">
              <span>Projection: <strong class="text-cyan">{{ active3DProjectionMode }}</strong> | Preset: <strong class="text-gold">{{ active3DCameraPreset }}</strong> | Pitch: <strong>{{ Math.round(rotX) }}°</strong>, Yaw: <strong>{{ Math.round(rotY) }}°</strong>, Roll: <strong>{{ Math.round(rotZ) }}°</strong></span>
              <div class="axis-buttons">
                <button class="btn btn-xs btn-outline" @click="rotX += 15">Pitch +</button>
                <button class="btn btn-xs btn-outline" @click="rotY += 15">Yaw +</button>
                <button class="btn btn-xs btn-outline" @click="rotZ += 15">Roll +</button>
                <button class="btn btn-xs btn-outline" @click="zoom3D = Math.max(0.5, zoom3D - 0.1)">Zoom -</button>
                <button class="btn btn-xs btn-outline" @click="zoom3D = Math.min(2.5, zoom3D + 0.1)">Zoom +</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 2D Aircraft Glyph & Cabin Matrix Visualizer -->
        <div class="content-panel">
          <div class="panel-header">
            <div>
              <h3>Aircraft Glyph &amp; Cabin Seating Matrix</h3>
              <span class="badge-algo">PlaneGlyph.cpp &amp; Seats.cpp</span>
              <p class="panel-hint">Top-down fuselage glyph with cockpit, First Class, Business Class, and Economy Class seat matrices.</p>
            </div>
            <div class="header-actions">
              <button class="btn btn-xs" :class="cgTextureEnabled ? 'btn-primary' : 'btn-outline'" @click="cgTextureEnabled = !cgTextureEnabled">
                Texture: {{ cgTextureEnabled ? 'ON' : 'OFF' }}
              </button>
              <button class="btn btn-xs" :class="cgLightingEnabled ? 'btn-primary' : 'btn-outline'" @click="cgLightingEnabled = !cgLightingEnabled">
                Lighting: {{ cgLightingEnabled ? 'ON' : 'OFF' }}
              </button>
            </div>
          </div>

          <!-- Zone Zoom Controls (SeatMapTransform.cpp) -->
          <div class="zoom-toolbar">
            <span class="toolbar-label">Zone Zoom (SeatMapTransform.cpp):</span>
            <button
              v-for="z in zoomZones"
              :key="z.id"
              :class="['btn-zone', { active: activeZone === z.id }]"
              @click="setZoomZone(z.id)"
            >
              {{ z.name }}
            </button>
          </div>

          <!-- SVG Aircraft Frame -->
          <div class="plane-frame-container">
            <svg
              class="plane-svg-canvas"
              viewBox="0 0 1200 620"
              :style="{ transform: `scale(${zoomScale}) translate(${panX}px, ${panY}px)`, transformOrigin: 'center center' }"
            >
              <defs>
                <linearGradient id="fuselageGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stop-color="#eaf6ff"/>
                  <stop offset=".45" stop-color="#a8c5db"/>
                  <stop offset="1" stop-color="#6f91ac"/>
                </linearGradient>
                <pattern id="brushedMetalPattern" width="18" height="14" patternUnits="userSpaceOnUse">
                  <rect width="18" height="14" fill="#b8c8d5"/>
                  <path d="M0 2H18 M0 7H18 M0 12H18" stroke="#f4f9fd" stroke-opacity=".46" stroke-width="1"/>
                  <path d="M0 4H18 M0 10H18" stroke="#617d94" stroke-opacity=".3" stroke-width=".7"/>
                </pattern>
                <linearGradient id="wingGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop stop-color="#a6c1d3"/>
                  <stop offset="1" stop-color="#536f87"/>
                </linearGradient>
                <linearGradient id="windowGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop stop-color="#62ddec"/>
                  <stop offset="1" stop-color="#2583b9"/>
                </linearGradient>
              </defs>

              <!-- Aircraft Wings & Tail -->
              <g id="aircraft-wings">
                <path d="M505 276 L690 84 Q716 60 747 65 L690 278 Z" fill="url(#wingGrad)" stroke="#d5e7f5" stroke-width="3"/>
                <path d="M505 344 L690 536 Q716 560 747 555 L690 342 Z" fill="url(#wingGrad)" stroke="#d5e7f5" stroke-width="3"/>
                <path d="M920 278 L1040 187 Q1059 174 1074 180 L1010 286 Z" fill="url(#wingGrad)" stroke="#d5e7f5" stroke-width="3"/>
                <path d="M920 342 L1040 433 Q1059 446 1074 440 L1010 334 Z" fill="url(#wingGrad)" stroke="#d5e7f5" stroke-width="3"/>
                <ellipse cx="650" cy="157" rx="30" ry="47" fill="#1b2b3d" stroke="#8fa8bd" stroke-width="6"/>
                <ellipse cx="650" cy="463" rx="30" ry="47" fill="#1b2b3d" stroke="#8fa8bd" stroke-width="6"/>
              </g>

              <!-- Optional Brushed Metal Texture Layer -->
              <g v-if="cgTextureEnabled" id="texture-layer" opacity=".35">
                <path d="M505 276 L690 84 Q716 60 747 65 L690 278 Z" fill="url(#brushedMetalPattern)"/>
                <path d="M505 344 L690 536 Q716 560 747 555 L690 342 Z" fill="url(#brushedMetalPattern)"/>
              </g>

              <!-- Optional Directional Specular Highlights Layer -->
              <g v-if="cgLightingEnabled" id="lighting-layer">
                <path d="M540 250 L714 77" fill="none" stroke="#fff" stroke-width="5" opacity=".48"/>
                <path d="M540 370 L714 543" fill="none" stroke="#fff" stroke-width="5" opacity=".42"/>
              </g>

              <!-- Fuselage Body -->
              <path
                d="M112 310 C137 278 176 258 226 252 L1000 252 C1066 254 1113 279 1147 310 C1113 341 1066 366 1000 368 L226 368 C176 362 137 342 112 310 Z"
                fill="url(#fuselageGrad)"
                stroke="#eff8ff"
                stroke-width="4"
              />

              <!-- Cockpit Window -->
              <path d="M115 310 C133 286 157 273 187 264 L187 356 C157 347 133 334 115 310 Z" fill="url(#windowGrad)" stroke="#d3fbff" stroke-width="3"/>

              <!-- Cabin Interior Floor & Divider Lines -->
              <path d="M145 310 C166 291 192 281 226 279 L995 279 C1045 281 1082 295 1107 310 C1082 325 1045 339 995 341 L226 341 C192 339 166 329 145 310 Z" fill="#102239" stroke="#7392aa" stroke-width="2"/>
              <line x1="226" y1="310" x2="997" y2="310" stroke="#87a1b5" stroke-width="2" stroke-dasharray="8 7" opacity=".8"/>

              <!-- Cabin Labels -->
              <text x="151" y="386" class="cg-label">COCKPIT</text>
              <text x="278" y="270" class="cg-zone-label">FIRST</text>
              <text x="452" y="270" class="cg-zone-label">BUSINESS</text>
              <text x="738" y="270" class="cg-zone-label">ECONOMY</text>

              <!-- Interactive Cabin Seats -->
              <g id="cabin-seats">
                <g
                  v-for="s in cgSeats"
                  :key="s.id"
                  :class="['svg-seat-node', s.classType, s.status, { selected: s.selected }]"
                  @click="toggleCgSeat(s)"
                >
                  <rect :x="s.x" :y="s.y" :width="s.width" :height="s.height" rx="3" />
                  <text :x="s.x + s.width/2" :y="s.y + s.height/2 + 3" text-anchor="middle" font-size="9" font-weight="bold">{{ s.label }}</text>
                </g>
              </g>
            </svg>
          </div>

          <!-- Seat Legend & Live Selection Status (Finalized 8-Color Palette & Textures) -->
          <div class="cg-legend">
            <span><i class="swatch plum"></i> First Class (Royal Plum / Gold)</span>
            <span><i class="swatch sapphire"></i> Business (Sapphire Blue)</span>
            <span><i class="swatch emerald"></i> Economy (Emerald Woven)</span>
            <span><i class="swatch amber"></i> Selected (Golden Amber)</span>
            <span><i class="swatch crimson"></i> Booked (Crimson Red)</span>
            <span><i class="swatch slate"></i> Blocked (Exit Slate)</span>
            <span><i class="swatch navy"></i> Pilot (Navy)</span>
            <span><i class="swatch orange"></i> Crew (Safety Orange)</span>
            <div class="legend-stats">
              Selected: <strong>{{ selectedCgSeatsCount }}</strong> |
              Available: <strong>{{ availableCgSeatsCount }}</strong> |
              Booked: <strong>{{ bookedCgSeatsCount }}</strong>
            </div>
          </div>
        </div>

        <!-- CG Algorithms: Bresenham Line & Cohen-Sutherland Clipping -->
        <div class="two-col-layout">
          <!-- Bresenham Flight Route Algorithm -->
          <div class="content-panel">
            <div class="panel-header">
              <div>
                <h3>Bresenham Route Rasterization Algorithm</h3>
                <span class="badge-algo">Bresenham.cpp</span>
                <p class="panel-hint">Integer error decision: <code>p_k = 2Δy - Δx</code>. Plots rasterized route pixels.</p>
              </div>
            </div>

            <div class="algo-canvas-box">
              <svg viewBox="0 0 500 240" class="algo-svg">
                <g class="grid-lines" stroke="#263c52" stroke-width="1">
                  <line v-for="x in 10" :key="'gx'+x" :x1="x * 45 + 20" y1="20" :x2="x * 45 + 20" y2="220" />
                  <line v-for="y in 5" :key="'gy'+y" x1="20" :y1="y * 40 + 20" x2="470" :y2="y * 40 + 20" />
                </g>
                <path d="M60 190 L440 55" stroke="#55d5e8" stroke-width="3" stroke-dasharray="6 6" class="route-line" />
                <circle cx="60" cy="190" r="8" fill="#ffc76a" stroke="#fff" stroke-width="2" />
                <circle cx="440" cy="55" r="8" fill="#ffc76a" stroke="#fff" stroke-width="2" />
                <text x="40" y="215" fill="#e2e8f0" font-size="12">BOM (Mumbai)</text>
                <text x="420" y="42" fill="#e2e8f0" font-size="12">DEL (Delhi)</text>

                <!-- Rasterized Integer Pixels -->
                <rect
                  v-for="(px, i) in bresenhamPixels"
                  :key="i"
                  :x="px.x - 3"
                  :y="px.y - 3"
                  width="7"
                  height="7"
                  fill="#55d5e8"
                />
              </svg>
              <div class="algo-status-bar">
                <span>Rasterized Pixels: <strong>{{ bresenhamPixels.length }} Points</strong></span>
                <span>Algorithm: <strong>Bresenham (Zero Floating-Point)</strong></span>
              </div>
            </div>
          </div>

          <!-- Cohen-Sutherland Line Clipping Lab -->
          <div class="content-panel">
            <div class="panel-header">
              <div>
                <h3>Cohen-Sutherland Line Clipping Lab</h3>
                <span class="badge-algo">LineClipping.cpp</span>
                <p class="panel-hint">4-bit region outcodes (TBRL). Clips routes against viewing window [0..10].</p>
              </div>
            </div>

            <div class="algo-canvas-box">
              <div class="clipping-inputs-row">
                <div class="clip-inp">
                  <label>X1</label>
                  <input type="number" v-model.number="clipCoords.x1" min="-5" max="15" class="form-input sm" />
                </div>
                <div class="clip-inp">
                  <label>Y1</label>
                  <input type="number" v-model.number="clipCoords.y1" min="-5" max="15" class="form-input sm" />
                </div>
                <div class="clip-inp">
                  <label>X2</label>
                  <input type="number" v-model.number="clipCoords.x2" min="-5" max="15" class="form-input sm" />
                </div>
                <div class="clip-inp">
                  <label>Y2</label>
                  <input type="number" v-model.number="clipCoords.y2" min="-5" max="15" class="form-input sm" />
                </div>
              </div>

              <svg viewBox="0 0 500 240" class="algo-svg">
                <!-- Rectangular Clipping Window [155, 60] to [345, 180] -->
                <rect x="155" y="60" width="190" height="120" fill="rgba(85, 214, 160, 0.12)" stroke="#55d6a0" stroke-width="2" />
                <text x="160" y="52" fill="#55d6a0" font-size="11">Window (0,0) to (10,10)</text>

                <!-- Original Unclipped Line (Dashed Gold) -->
                <line
                  :x1="mapClipCoordX(clipCoords.x1)"
                  :y1="mapClipCoordY(clipCoords.y1)"
                  :x2="mapClipCoordX(clipCoords.x2)"
                  :y2="mapClipCoordY(clipCoords.y2)"
                  stroke="#ffc76a"
                  stroke-width="2"
                  stroke-dasharray="4 4"
                />

                <!-- Clipped Visible Segment (Cyan) -->
                <line
                  v-if="clippedResult.visible"
                  :x1="mapClipCoordX(clippedResult.cx1)"
                  :y1="mapClipCoordY(clippedResult.cy1)"
                  :x2="mapClipCoordX(clippedResult.cx2)"
                  :y2="mapClipCoordY(clippedResult.cy2)"
                  stroke="#55d5e8"
                  stroke-width="4"
                  stroke-linecap="round"
                />

                <!-- Endpoints -->
                <circle :cx="mapClipCoordX(clipCoords.x1)" :cy="mapClipCoordY(clipCoords.y1)" r="5" fill="#ffc76a" />
                <circle :cx="mapClipCoordX(clipCoords.x2)" :cy="mapClipCoordY(clipCoords.y2)" r="5" fill="#ffc76a" />
              </svg>

              <div class="algo-status-bar">
                <span>Clipping Verdict: <strong>{{ clippedResult.message }}</strong></span>
                <span>Clipped Segment: <strong>{{ clippedResult.visible ? `(${clippedResult.cx1.toFixed(1)}, ${clippedResult.cy1.toFixed(1)}) → (${clippedResult.cx2.toFixed(1)}, ${clippedResult.cy2.toFixed(1)})` : 'None' }}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { aircraftWorldSeatToSvg } from '../utils/aircraftCoordinates.js';
import { academicApi, flightApi, seatApi } from '../services/api';
import { useAdminStore } from '../stores/adminStore';
import { useAuthStore } from '../stores/authStore';

// =============================================================================
// MAIN NAVIGATION TABS
// =============================================================================
const activeMainTab = ref('overview');
const adminStore = useAdminStore();
const authStore = useAuthStore();

const mainTabs = [
  { id: 'overview', name: 'Overview & API', icon: '☁', sub: 'Operations & Topology' },
  { id: 'java', name: 'Java OOP Hub', icon: '☕', sub: 'PSOOP, PNR, Overload, Swing' },
  { id: 'ds', name: 'Data Structures Lab', icon: '🌲', sub: 'Queues, Deque, DLL, Stack' },
  { id: 'coa', name: 'COA & Architecture', icon: '⚙', sub: 'Hardware Threshold, ALU' },
  { id: 'cg', name: 'Computer Graphics', icon: '🎨', sub: 'Browser CG, Native Coursework' }
];

// =============================================================================
// LIVE OPERATIONAL API DATA
// =============================================================================
const apiFlights = ref([]);
const selectedFlightId = ref('');
const seatInventory = ref([]);
const loadingFlights = ref(false);
const loadingSeats = ref(false);
const loadingOperations = ref(false);
const flightsLoaded = ref(false);
const flightApiError = ref('');
const seatApiError = ref('');
const operationsError = ref('');
const operationalStats = ref(null);
const operationalSearch = ref('');
const nativeDemo = ref(null);
const loadingNativeDemo = ref(false);
const nativeDemoError = ref('');
const flightApiStatus = computed(() => loadingFlights.value ? 'Loading API…' : flightsLoaded.value ? 'Express API / Supabase' : 'API unavailable');
const selectedFlight = computed(() => apiFlights.value.find(flight => String(flight.id) === String(selectedFlightId.value)) || null);
const totalSeatsCount = computed(() => seatInventory.value.length);
const bookedSeatsCount = computed(() => seatInventory.value.filter(seat => seat.is_occupied && !seat.is_blocked).length);
const blockedSeatsCount = computed(() => seatInventory.value.filter(seat => seat.is_blocked).length);
const availableSeatsCount = computed(() => seatInventory.value.filter(seat => !seat.is_occupied && !seat.is_blocked).length);
const hasSeatData = computed(() => Boolean(selectedFlight.value && !loadingSeats.value && !seatApiError.value && totalSeatsCount.value > 0));
const occupancyPercentage = computed(() => totalSeatsCount.value
  ? Math.floor(bookedSeatsCount.value * 100 / totalSeatsCount.value)
  : 0);
const occupancyStatus = computed(() => occupancyPercentage.value >= 90 ? 'FULL' : occupancyPercentage.value >= 75 ? 'RUNNING LOW' : 'OPEN');
const occupancyStatusClass = computed(() => !hasSeatData.value ? '' : occupancyStatus.value === 'FULL' ? 'status-red' : occupancyStatus.value === 'RUNNING LOW' ? 'status-amber' : 'status-green');
const searchedAdminBookings = computed(() => {
  const query = operationalSearch.value.trim().toLowerCase();
  const rows = adminStore.bookings || [];
  const filtered = query
    ? rows.filter(booking => String(booking.pnr || '').toLowerCase().includes(query)
      || String(booking.passenger_id ?? '').toLowerCase().includes(query))
    : rows;
  return filtered.slice(0, query ? 50 : 10);
});
const searchedAdminPassengers = computed(() => {
  const query = operationalSearch.value.trim().toLowerCase();
  if (!query) return [];
  return (adminStore.passengers || []).filter(passenger => String(passenger.id ?? '').toLowerCase().includes(query)).slice(0, 20);
});

async function loadFlights() {
  loadingFlights.value = true;
  flightApiError.value = '';
  try {
    const response = await flightApi.getFlights({});
    apiFlights.value = Array.isArray(response.flights) ? response.flights : [];
    flightsLoaded.value = true;
    if (!selectedFlightId.value || !apiFlights.value.some(flight => String(flight.id) === String(selectedFlightId.value))) {
      selectedFlightId.value = apiFlights.value.length ? String(apiFlights.value[0].id) : '';
    }
    if (selectedFlightId.value) await loadSelectedFlightSeats();
    else seatInventory.value = [];
  } catch (err) {
    apiFlights.value = [];
    seatInventory.value = [];
    flightsLoaded.value = false;
    flightApiError.value = err.message || 'Unable to load flights from the API.';
  } finally {
    loadingFlights.value = false;
  }
}

async function loadSelectedFlightSeats() {
  if (!selectedFlightId.value) {
    seatInventory.value = [];
    return;
  }
  loadingSeats.value = true;
  seatApiError.value = '';
  try {
    const response = await seatApi.getSeatsByFlight(selectedFlightId.value);
    seatInventory.value = Array.isArray(response.seats) ? response.seats : [];
  } catch (err) {
    seatInventory.value = [];
    seatApiError.value = err.message || 'Unable to load seat inventory.';
  } finally {
    loadingSeats.value = false;
  }
}

async function loadAdminOperations() {
  if (!authStore.isAdmin || !authStore.token) return;
  loadingOperations.value = true;
  operationsError.value = '';
  try {
    const data = await adminStore.fetchOperationalData();
    operationalStats.value = data.stats;
  } catch (err) {
    operationsError.value = adminStore.operationsError || err.message || 'Unable to load authenticated admin data.';
  } finally {
    loadingOperations.value = false;
  }
}

async function loadNativeDemo() {
  loadingNativeDemo.value = true;
  nativeDemoError.value = '';
  try {
    const response = await academicApi.getCppDemo();
    if (response.success && response.source === 'cpp-ds-native-demo' && response.data) {
      nativeDemo.value = response.data;
    } else {
      throw new Error('The native C++ demo returned an unexpected response.');
    }
  } catch (err) {
    nativeDemo.value = null;
    nativeDemoError.value = err.message || 'Native C++ demo is unavailable.';
  } finally {
    loadingNativeDemo.value = false;
  }
}

async function refreshOperationalData() {
  await Promise.all([loadFlights(), authStore.isAdmin ? loadAdminOperations() : Promise.resolve()]);
}

function maskNativeContact(contact) {
  const value = String(contact || '');
  if (!value) return '—';
  return value.length <= 4 ? '••••' : `${'•'.repeat(Math.min(value.length - 4, 8))}${value.slice(-4)}`;
}

function getStatusClass(status) {
  if (!status) return 'blue';
  const s = status.toLowerCase();
  if (s.includes('time') || s.includes('complete')) return 'green';
  if (s.includes('delay') || s.includes('low')) return 'amber';
  if (s.includes('cancel')) return 'red';
  if (s.includes('board')) return 'violet';
  return 'blue';
}

const moduleOverviews = [
  {
    title: 'Java Object-Oriented Programming',
    subject: 'PSOOP / Java 17 / JDBC',
    icon: '☕',
    color: '#8b5cf6',
    desc: 'Encapsulation, inheritance (Person -> Passenger / Staff), booking persistence with explicit file errors, and Swing flight and booking-file screens.',
    sources: ['java-oop/src/model/PNR.java', 'java-oop/src/model/Flight.java', 'java-oop/src/service/BookingFileService.java', 'java-oop/src/BookingFileSwingForm.java', 'java-oop/src/FlightStatusForm.java']
  },
  {
    title: 'Data Structures & Algorithms',
    subject: 'C++17 / Linear & Non-Linear DS',
    icon: '🌲',
    color: '#10b981',
    desc: 'Passenger arrays, queues, stacks, PNR hashing, search comparisons, and quick/merge sort benchmarks across random and ordered datasets.',
    sources: ['cpp-ds/src/BoardingQueueCircular.cpp', 'cpp-ds/src/ManifestMergeDLL.cpp', 'cpp-ds/src/SearchComparison.cpp', 'cpp-ds/src/SortComparison.cpp', 'cpp-ds/src/undostack.cpp']
  },
  {
    title: 'Computer Organization & Architecture',
    subject: 'COA / 64-bit NASM & C++',
    icon: '⚙',
    color: '#f59e0b',
    desc: 'Low-level fare arithmetic, shared-input simulator/assembly parity checks, occupancy branches, and fetch-decode-execute control signals.',
    sources: ['assembly-component/fare_calc_sim.cpp', 'coa-nasm/run_fare_parity_demo.ps1', 'coa-nasm/HexToBCD.asm', 'coa-nasm/seat_availability_branches.asm']
  },
  {
    title: 'Computer Graphics Lab',
    subject: 'Native C++ / OpenGL coursework · browser-rendered demo',
    icon: '🎨',
    color: '#06b6d4',
    desc: 'Aircraft fuselage and seat geometry share a tested world-to-SVG coordinate map; projection matrices include numerical precision checks.',
    sources: ['cpp-cg/src/PlaneGlyph.cpp', 'cpp-cg/src/Seats.cpp', 'cpp-cg/src/AircraftProjectionViewing.cpp', 'cpp-cg/tests/AircraftProjectionViewingTest.cpp', 'frontend/src/utils/aircraftCoordinates.js']
  }
];

// =============================================================================
// TAB 2: JAVA OOP IMPLEMENTATION (PSOOP / JDBC)
// =============================================================================
const PNR_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateRandomPNR() {
  let res = '';
  for (let i = 0; i < 6; i++) {
    res += PNR_CHARS.charAt(Math.floor(Math.random() * PNR_CHARS.length));
  }
  return res;
}

const activePNR = ref(generateRandomPNR());

function generateNewPNR() {
  activePNR.value = generateRandomPNR();
}

const availableFlights = [
  { flightNumber: 'AI101', from: 'BOM', to: 'DEL' },
  { flightNumber: 'AI202', from: 'DEL', to: 'BLR' },
  { flightNumber: 'AI303', from: 'PNQ', to: 'HYD' },
  { flightNumber: 'AI404', from: 'BOM', to: 'BLR' },
  { flightNumber: 'AI505', from: 'BLR', to: 'DEL' }
];

const bookingForm = ref({
  name: 'Aarav Sharma',
  flight: 'AI101',
  seat: '12A',
  cabinClass: 'Economy'
});

const javaBookings = ref([
  { pnr: 'AI8K92', passengerName: 'Aarav Sharma', flightNumber: 'AI101', seatNumber: '12A', bookingClass: 'Economy', priority: 3, status: 'CONFIRMED' },
  { pnr: 'SK7M41', passengerName: 'Demo Passenger', flightNumber: 'AI202', seatNumber: '3B', bookingClass: 'Business', priority: 2, status: 'CONFIRMED' },
  { pnr: 'BL9X33', passengerName: 'Sneha Iyer', flightNumber: 'AI303', seatNumber: '1A', bookingClass: 'FirstClass', priority: 1, status: 'CONFIRMED' },
  { pnr: 'DL4Q78', passengerName: 'Rohan Mehta', flightNumber: 'AI101', seatNumber: '14C', bookingClass: 'Economy', priority: 3, status: 'CONFIRMED' },
  { pnr: 'HY5V12', passengerName: 'Priya Desai', flightNumber: 'AI404', seatNumber: '2F', bookingClass: 'FirstClass', priority: 1, status: 'CONFIRMED' }
]);

function createJavaBooking() {
  const priority = bookingForm.value.cabinClass === 'FirstClass' ? 1 : bookingForm.value.cabinClass === 'Business' ? 2 : 3;
  const newRecord = {
    pnr: activePNR.value,
    passengerName: bookingForm.value.name,
    flightNumber: bookingForm.value.flight,
    seatNumber: bookingForm.value.seat.toUpperCase(),
    bookingClass: bookingForm.value.cabinClass,
    priority,
    status: 'CONFIRMED'
  };

  javaBookings.value.unshift(newRecord);
  generateNewPNR();
  alert(`Ticket Confirmed!\nPNR: ${newRecord.pnr}\nPassenger: ${newRecord.passengerName}\nFlight: ${newRecord.flightNumber} | Seat: ${newRecord.seatNumber}`);
}

function cancelJavaBooking(pnr) {
  const b = javaBookings.value.find(item => item.pnr === pnr);
  if (b) {
    b.status = 'CANCELLED';
  }
}

function sortBookingsForBoarding() {
  javaBookings.value.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    const rowA = parseInt(a.seatNumber) || 999;
    const rowB = parseInt(b.seatNumber) || 999;
    return rowA - rowB;
  });
}

// Method Overloading Simulation
const overloadParams = ref({
  baseFare: 5000,
  cabinClass: 'Business',
  baggageKg: 20,
  promoCode: 'FLYAI10'
});

const overloadResults = computed(() => {
  const bf = overloadParams.value.baseFare;
  const cc = overloadParams.value.cabinClass;
  const bag = overloadParams.value.baggageKg;
  const promo = overloadParams.value.promoCode;

  // Overload 1: Base Fare
  const res1 = bf;

  // Overload 2: Base Fare * Class Multiplier
  const mult = cc === 'First Class' ? 2.5 : cc === 'Business' ? 1.8 : 1.0;
  const res2 = bf * mult;

  // Overload 3: Base Fare * Class Multiplier + Baggage Surcharge (Rs. 500/kg over 15kg)
  let extraBaggageFee = 0;
  if (bag > 15) {
    extraBaggageFee = (bag - 15) * 500;
  }
  const res3 = res2 + extraBaggageFee;

  // Overload 4: With Promo Code (10% instant discount if FLYAI10)
  let res4 = res3;
  if (promo && promo.trim().toUpperCase() === 'FLYAI10') {
    res4 = res3 * 0.90;
  }

  return {
    overload1: res1,
    overload2: res2,
    overload3: res3,
    overload4: res4
  };
});

// Swing Desktop Form Simulator
const swingForm = ref({
  flightNo: 'DEMO-001',
  destination: 'Example destination',
  status: 'DEMO STATUS'
});

const swingTerminalOutput = ref(`Local browser simulation data — no database connection
  DEMO-001 -> Example destination | DEMO STATUS
Ready for simulated updates.`);

function handleSwingAdd() {
  swingTerminalOutput.value += `\n[INSERT] Added flight ${swingForm.value.flightNo} -> ${swingForm.value.destination} [${swingForm.value.status}]`;
}

function handleSwingUpdate() {
  swingTerminalOutput.value += `\n[UPDATE] Flight ${swingForm.value.flightNo} status updated to: ${swingForm.value.status}`;
}

function handleSwingView() {
  swingTerminalOutput.value += `\n[SIMULATED SELECT]:\n  DEMO-001 -> Example destination [DEMO STATUS]\n  ${swingForm.value.flightNo} -> ${swingForm.value.destination} [${swingForm.value.status}]`;
}

// -----------------------------------------------------------------------------
// Generic Repository Architecture (<T, ID>) Demonstration
// -----------------------------------------------------------------------------
const activeRepoOp = ref('findById');
const repoQueryPnr = ref('AI8K92');
const repoQueryFlight = ref('AI101');
const newRepoPassengerName = ref('Vikram Rao');
const newRepoSeat = ref('5B');
const repoDeletePnr = ref('SK7M41');

const repoConsoleTrace = ref(`[INIT] GenericRepository<Booking, String> instantiated via InMemoryRepository.
Storage backend: ConcurrentHashMap<String, Booking>
Key Extractor: Booking::getPnr
Loaded 5 seed booking entities.
Contracts available: save(T), findById(ID), findAll(), findBy(Predicate), deleteById(ID).`);

function executeRepoLookup() {
  const pnr = repoQueryPnr.value.trim().toUpperCase();
  const found = javaBookings.value.find(b => b.pnr === pnr);
  if (found) {
    repoConsoleTrace.value += `\n[OPTIONAL<BOOKING> findById("${pnr}")] -> SUCCESS:
  Passenger : ${found.passengerName}
  Flight    : ${found.flightNumber}
  Seat      : ${found.seatNumber} (${found.bookingClass})
  Status    : ${found.status} (Priority ${found.priority})`;
  } else {
    repoConsoleTrace.value += `\n[OPTIONAL<BOOKING> findById("${pnr}")] -> Optional.empty() (No entity matching PNR)`;
  }
}

function executeRepoFilter() {
  const flight = repoQueryFlight.value;
  const filtered = javaBookings.value.filter(b => b.flightNumber === flight);
  repoConsoleTrace.value += `\n[STREAM findBy(b -> b.getFlightNumber().equals("${flight}"))] -> ${filtered.length} matches:`;
  filtered.forEach(b => {
    repoConsoleTrace.value += `\n  * ${b.pnr}: ${b.passengerName} [Seat ${b.seatNumber}]`;
  });
}

function executeRepoSave() {
  const newPnr = generateRandomPNR();
  const entity = {
    pnr: newPnr,
    passengerName: newRepoPassengerName.value || 'New Passenger',
    flightNumber: 'AI101',
    seatNumber: newRepoSeat.value.toUpperCase() || '7A',
    bookingClass: 'Business',
    priority: 2,
    status: 'CONFIRMED'
  };
  javaBookings.value.unshift(entity);
  repoConsoleTrace.value += `\n[SAVE(Booking)] -> Saved entity with key PNR "${newPnr}". Total count = ${javaBookings.value.length}`;
}

function executeRepoDelete() {
  const pnr = repoDeletePnr.value.trim().toUpperCase();
  const idx = javaBookings.value.findIndex(b => b.pnr === pnr);
  if (idx !== -1) {
    const deleted = javaBookings.value.splice(idx, 1)[0];
    repoConsoleTrace.value += `\n[DELETE_BY_ID("${pnr}")] -> true (Removed booking for ${deleted.passengerName}). Count = ${javaBookings.value.length}`;
  } else {
    repoConsoleTrace.value += `\n[DELETE_BY_ID("${pnr}")] -> false (Entity not present in repository)`;
  }
}

// -----------------------------------------------------------------------------
// Booking File Save & Load Service (BookingFileService.java / CSV / Binary)
// -----------------------------------------------------------------------------
const fileStatusMessage = ref('');
const csvFileContent = ref('');

function generateCsvFromBookings() {
  const header = 'BookingID,PNR,PassengerName,FlightNumber,SeatNumber,BookingDate,Fare,Status';
  const rows = javaBookings.value.map(b => {
    const bookingId = 'BK-' + b.pnr;
    const fare = b.bookingClass === 'FirstClass' ? 20000.0 : b.bookingClass === 'Business' ? 12000.0 : 5000.0;
    return `${bookingId},${b.pnr},"${b.passengerName}",${b.flightNumber},${b.seatNumber},2026-10-15,${fare.toFixed(2)},${b.status}`;
  });
  return [header, ...rows].join('\n');
}

csvFileContent.value = generateCsvFromBookings();

function exportBookingsToCsv() {
  csvFileContent.value = generateCsvFromBookings();
  fileStatusMessage.value = `✓ Generated standard RFC 4180 CSV from ${javaBookings.value.length} booking records.`;
}

function importBookingsFromCsv() {
  try {
    const lines = csvFileContent.value.trim().split('\n');
    if (lines.length <= 1) {
      fileStatusMessage.value = '⚠ CSV contains only headers or is empty.';
      return;
    }
    const newBookings = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(',');
      if (parts.length >= 8) {
        newBookings.push({
          pnr: parts[1].replace(/"/g, '').trim(),
          passengerName: parts[2].replace(/"/g, '').trim(),
          flightNumber: parts[3].trim(),
          seatNumber: parts[4].trim(),
          bookingClass: 'Economy',
          priority: 3,
          status: parts[7].trim() || 'CONFIRMED'
        });
      }
    }
    if (newBookings.length > 0) {
      javaBookings.value = newBookings;
      fileStatusMessage.value = `✓ Successfully loaded ${newBookings.length} booking records into repository.`;
    }
  } catch (e) {
    fileStatusMessage.value = '✕ Error parsing CSV: ' + e.message;
  }
}

function downloadCsvFile() {
  const blob = new Blob([csvFileContent.value], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', 'airline_bookings.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  fileStatusMessage.value = '✓ Downloaded airline_bookings.csv to your device.';
}


// =============================================================================
// TAB 3: DATA STRUCTURES (DS) IMPLEMENTATION (cpp-ds)
// =============================================================================
// 1. Circular Queue
const circularQueue = ref({
  capacity: 8,
  front: 0,
  rear: 4,
  count: 4,
  slots: [
    { name: 'Aarav S.', group: 1 },
    { name: 'Sneha I.', group: 1 },
    { name: 'Rohan M.', group: 2 },
    { name: 'Priya D.', group: 2 },
    null,
    null,
    null,
    null
  ]
});

const circularQueueIsFull = computed(() => circularQueue.value.count >= circularQueue.value.capacity);

const newQueuePassenger = ref({
  name: 'Vikram R.',
  group: 3
});

function enqueuePassenger() {
  if (circularQueueIsFull.value) return;
  const p = { name: newQueuePassenger.value.name, group: newQueuePassenger.value.group };
  circularQueue.value.slots[circularQueue.value.rear] = p;
  circularQueue.value.rear = (circularQueue.value.rear + 1) % circularQueue.value.capacity;
  circularQueue.value.count++;
}

function dequeuePassenger() {
  if (circularQueue.value.count === 0) return;
  circularQueue.value.slots[circularQueue.value.front] = null;
  circularQueue.value.front = (circularQueue.value.front + 1) % circularQueue.value.capacity;
  circularQueue.value.count--;
}

// 2. Priority Deque
const dequeModes = [
  { value: 'UNRESTRICTED', label: 'Unrestricted (Full Deque)' },
  { value: 'INPUT_RESTRICTED', label: 'Input-Restricted (Rear Only)' },
  { value: 'OUTPUT_RESTRICTED', label: 'Output-Restricted (Front Only)' }
];
const currentDequeMode = ref('UNRESTRICTED');

const dequeList = ref([
  { pnr: 'PNR-E1', name: 'Dr. Kulkarni', age: 72, category: 'ELDERLY' },
  { pnr: 'PNR-V1', name: 'Cmdr. Kapoor', age: 48, category: 'VIP' },
  { pnr: 'PNR-N1', name: 'Tanvi Shah', age: 24, category: 'NORMAL' },
  { pnr: 'PNR-N2', name: 'Aditya Sen', age: 31, category: 'NORMAL' }
]);

const newDequePassenger = ref({
  name: 'Ramesh Patel',
  age: 65,
  category: 'ELDERLY'
});

function insertDequeFront() {
  if (currentDequeMode.value === 'INPUT_RESTRICTED') return;
  if (dequeList.value.length >= 6) return;
  dequeList.value.unshift({
    pnr: 'PNR-' + Math.floor(Math.random() * 900 + 100),
    name: newDequePassenger.value.name,
    age: newDequePassenger.value.age,
    category: newDequePassenger.value.category
  });
}

function insertDequeRear() {
  if (dequeList.value.length >= 6) return;
  dequeList.value.push({
    pnr: 'PNR-' + Math.floor(Math.random() * 900 + 100),
    name: newDequePassenger.value.name,
    age: newDequePassenger.value.age,
    category: newDequePassenger.value.category
  });
}

function deleteDequeFront() {
  if (dequeList.value.length === 0) return;
  dequeList.value.shift();
}

function deleteDequeRear() {
  if (currentDequeMode.value === 'OUTPUT_RESTRICTED') return;
  if (dequeList.value.length === 0) return;
  dequeList.value.pop();
}

// 3. Seat Selection Undo Stack
const seatStackStates = ref({});
const stackItems = ref([
  { seat: 5, type: 'S' },
  { seat: 12, type: 'S' },
  { seat: 18, type: 'S' }
]);

// Initialize seat states
for (let i = 1; i <= 30; i++) {
  seatStackStates.value[i] = [5, 12, 18].includes(i);
}

const stackItemsReversed = computed(() => [...stackItems.value].reverse());

function toggleStackSeat(seatNum) {
  const current = !!seatStackStates.value[seatNum];
  seatStackStates.value[seatNum] = !current;
  stackItems.value.push({
    seat: seatNum,
    type: !current ? 'S' : 'C'
  });
}

function popStackUndo() {
  if (stackItems.value.length === 0) return;
  const last = stackItems.value.pop();
  if (last.type === 'S') {
    seatStackStates.value[last.seat] = false;
  } else {
    seatStackStates.value[last.seat] = true;
  }
}

// 4. Manifest Merge Doubly Linked List
const manifestGroupA = ref([
  { pnr: 'PNR101', name: 'Prasad', seat: '1A' },
  { pnr: 'PNR102', name: 'Rahul', seat: '5B' }
]);

const manifestGroupB = ref([
  { pnr: 'PNR103', name: 'Varad', seat: '2A' },
  { pnr: 'PNR104', name: 'Siddhi', seat: '4C' }
]);

const mergedManifest = ref([]);

function executeManifestMerge() {
  const combined = [...manifestGroupA.value, ...manifestGroupB.value];
  combined.sort((a, b) => {
    const rowA = parseInt(a.seat);
    const rowB = parseInt(b.seat);
    if (rowA !== rowB) return rowA - rowB;
    return a.seat.localeCompare(b.seat);
  });
  mergedManifest.value = combined;
}

// -----------------------------------------------------------------------------
// PNR Hash Table with Collision Handling (Separate Chaining) Implementation
// -----------------------------------------------------------------------------
const hashTableCapacity = ref(7); // Prime modulus
const hashTableBuckets = ref([
  [], // 0
  [{ pnr: 'AI8K92', name: 'Aarav Sharma', flight: 'AI101', seat: '12A' }], // 1
  [{ pnr: 'DL4Q78', name: 'Rohan Mehta', flight: 'AI101', seat: '14C' }], // 2
  [
    { pnr: 'CC2W99', name: 'Vikram Rao', flight: 'AI505', seat: '8D' },
    { pnr: 'HY5V12', name: 'Priya Desai', flight: 'AI404', seat: '2F' }
  ], // 3 (Collision chain!)
  [
    { pnr: 'PNR101', name: 'Ananya Verma', flight: 'AI101', seat: '10E' },
    { pnr: 'SK7M41', name: 'Demo Passenger', flight: 'AI202', seat: '3B' }
  ], // 4 (Collision chain!)
  [
    { pnr: 'PNR102', name: 'Karan Malhotra', flight: 'AI202', seat: '5A' },
    { pnr: 'BL9X33', name: 'Sneha Iyer', flight: 'AI303', seat: '1A' }
  ], // 5 (Collision chain!)
  []  // 6
]);

const hashTableRecordsCount = computed(() => {
  return hashTableBuckets.value.reduce((acc, b) => acc + b.length, 0);
});

const hashTableCollisionCount = computed(() => {
  return hashTableBuckets.value.reduce((acc, b) => acc + (b.length > 1 ? b.length - 1 : 0), 0);
});

const hashSearchQuery = ref('BL9X33');
const hashSearchResult = ref('');

function executeHashSearch() {
  const query = hashSearchQuery.value.trim().toUpperCase();
  if (!query) {
    hashSearchResult.value = 'Please enter a PNR to lookup.';
    return;
  }

  // Calculate polynomial rolling hash with prime 31 modulo 7
  let hash = 0;
  for (let i = 0; i < query.length; i++) {
    hash = (hash * 31 + query.charCodeAt(i)) % hashTableCapacity.value;
  }

  const bucket = hashTableBuckets.value[hash] || [];
  let probes = 0;
  let found = null;

  for (let node of bucket) {
    probes++;
    if (node.pnr === query) {
      found = node;
      break;
    }
  }

  if (found) {
    hashSearchResult.value = `✓ FOUND in Bucket [${hash}] after ${probes} probe(s): ${found.pnr} -> ${found.name} (${found.flight} Seat ${found.seat})`;
  } else {
    hashSearchResult.value = `✕ NOT FOUND in Bucket [${hash}] (Searched ${probes} chain node(s)). O(1) hash resolution complete.`;
  }
}

// -----------------------------------------------------------------------------
// Binary Search vs Linear Search Live Comparison (SearchComparison.cpp)
// -----------------------------------------------------------------------------
const searchBenchmarkQuery = ref('SK7M41');
const searchBenchmarkDataset = ref([
  { pnr: 'AI1001', name: 'Aarav Sharma', flight: 'AI101', seat: '12A' },
  { pnr: 'AI1024', name: 'Isha Verma', flight: 'AI101', seat: '5B' },
  { pnr: 'BL9X33', name: 'Sneha Iyer', flight: 'AI303', seat: '1A' },
  { pnr: 'CC2W99', name: 'Vikram Rao', flight: 'AI505', seat: '8D' },
  { pnr: 'DL4Q78', name: 'Rohan Mehta', flight: 'AI101', seat: '14C' },
  { pnr: 'HY5V12', name: 'Priya Desai', flight: 'AI404', seat: '2F' },
  { pnr: 'KL3P55', name: 'Tanvi Shah', flight: 'AI202', seat: '19C' },
  { pnr: 'PNR101', name: 'Ananya Verma', flight: 'AI101', seat: '10E' },
  { pnr: 'PNR102', name: 'Karan Malhotra', flight: 'AI202', seat: '5A' },
  { pnr: 'PNR103', name: 'Varad K.', flight: 'AI303', seat: '2A' },
  { pnr: 'PNR104', name: 'Siddhi P.', flight: 'AI303', seat: '4C' },
  { pnr: 'SK7M41', name: 'Demo Passenger', flight: 'AI202', seat: '3B' },
  { pnr: 'UA8901', name: 'Aditya Sen', flight: 'AI404', seat: '22D' },
  { pnr: 'VA9042', name: 'Ramesh Patel', flight: 'AI505', seat: '16E' },
  { pnr: 'WA9155', name: 'Pooja Hegde', flight: 'AI101', seat: '7A' },
  { pnr: 'ZA9999', name: 'Zaid Khan', flight: 'AI202', seat: '11F' }
]);

const linearSearchStats = ref({
  found: true,
  index: 11,
  comparisons: 12,
  timeMicro: 18,
  trace: []
});

const binarySearchStats = ref({
  found: true,
  index: 11,
  comparisons: 4,
  timeMicro: 6,
  trace: []
});

function executeSearchComparison() {
  const target = searchBenchmarkQuery.value.trim().toUpperCase();
  if (!target) return;
  const list = searchBenchmarkDataset.value;
  const n = list.length;

  // 1. Linear Search
  let lComps = 0;
  let lFound = false;
  let lIdx = -1;
  const lTrace = [];
  const t0 = performance.now();

  for (let i = 0; i < n; i++) {
    lComps++;
    const curr = list[i].pnr;
    if (curr === target) {
      lFound = true;
      lIdx = i;
      lTrace.push(`Index [${i}]: '${curr}' == '${target}' -> MATCH FOUND!`);
      break;
    } else {
      if (lTrace.length < 5 || i === n - 1) {
        lTrace.push(`Index [${i}]: '${curr}' != '${target}' (No match, continue scan)`);
      } else if (lTrace.length === 5) {
        lTrace.push(`... [Sequential scan continues] ...`);
      }
    }
  }
  const t1 = performance.now();
  linearSearchStats.value = {
    found: lFound,
    index: lIdx,
    comparisons: lComps,
    timeMicro: Math.max(1, Math.round((t1 - t0) * 1000)),
    trace: lTrace
  };

  // 2. Binary Search (requires sorted array)
  let bComps = 0;
  let bFound = false;
  let bIdx = -1;
  const bTrace = [];
  let low = 0;
  let high = n - 1;
  const t2 = performance.now();

  while (low <= high) {
    const mid = Math.floor(low + (high - low) / 2);
    bComps++;
    const curr = list[mid].pnr;
    if (curr === target) {
      bFound = true;
      bIdx = mid;
      bTrace.push(`Step ${bTrace.length + 1}: Range [${low}..${high}], Mid = ${mid} ('${curr}') == Target -> FOUND!`);
      break;
    } else if (curr < target) {
      bTrace.push(`Step ${bTrace.length + 1}: Range [${low}..${high}], Mid = ${mid} ('${curr}') < Target -> Search RIGHT [${mid + 1}..${high}]`);
      low = mid + 1;
    } else {
      bTrace.push(`Step ${bTrace.length + 1}: Range [${low}..${high}], Mid = ${mid} ('${curr}') > Target -> Search LEFT [${low}..${mid - 1}]`);
      high = mid - 1;
    }
  }
  const t3 = performance.now();
  binarySearchStats.value = {
    found: bFound,
    index: bIdx,
    comparisons: bComps,
    timeMicro: Math.max(1, Math.round((t3 - t2) * 1000)),
    trace: bTrace
  };
}

executeSearchComparison();


// =============================================================================
// TAB 4: COA & COMPUTER ARCHITECTURE IMPLEMENTATION
// =============================================================================
const seatRegisterBitmask = computed(() => {
  // Convert bookedSeatsCount into 16-bit binary string
  const n = bookedSeatsCount.value & 0xFFFF;
  return '0b' + n.toString(2).padStart(16, '0').match(/.{4}/g).join(' ');
});

// 64-bit ALU Simulator
const raxRegister = ref(5000);
const rbxRegister = ref(900);
const rcxRegister = ref(500);
const currentAluStep = ref(0);
const aluTerminalLog = ref(`[INIT] Hardware Registers:
  RAX: 0x00000000 (0)
  RBX: 0x00000000 (0)
  RCX: 0x00000000 (0)
Click 'Clock Step' to execute x86-64 micro-instructions.`);

const aluFlags = ref({ ZF: false, CF: false, SF: false, OF: false });

function resetAluSimulation() {
  raxRegister.value = 0;
  rbxRegister.value = 0;
  rcxRegister.value = 0;
  currentAluStep.value = 0;
  aluFlags.value = { ZF: true, CF: false, SF: false, OF: false };
  aluTerminalLog.value = `[RESET] Registers cleared to 0. Flag ZF=1.`;
}

function stepAluClock() {
  currentAluStep.value = (currentAluStep.value % 5) + 1;
  const step = currentAluStep.value;

  if (step === 1) {
    raxRegister.value = 5000;
    aluTerminalLog.value += `\n[T1] MOV RAX, 5000     -> Base Fare loaded into RAX: Rs. 5000 (0x1388)`;
  } else if (step === 2) {
    rbxRegister.value = 900;
    aluTerminalLog.value += `\n[T2] MOV RBX, 900      -> Aviation Tax loaded into RBX: Rs. 900 (0x384)`;
  } else if (step === 3) {
    rcxRegister.value = 500;
    aluTerminalLog.value += `\n[T3] MOV RCX, 500      -> Promo Discount loaded into RCX: Rs. 500 (0x1F4)`;
  } else if (step === 4) {
    raxRegister.value = raxRegister.value + rbxRegister.value;
    aluTerminalLog.value += `\n[T4] ADD RAX, RBX      -> Intermediate Fare (Base + Tax): Rs. ${raxRegister.value} (0x${raxRegister.value.toString(16).toUpperCase()})`;
  } else if (step === 5) {
    raxRegister.value = raxRegister.value - rcxRegister.value;
    aluFlags.value.ZF = raxRegister.value === 0;
    aluFlags.value.SF = raxRegister.value < 0;
    aluTerminalLog.value += `\n[T5] SUB RAX, RCX      -> FINAL FARE IN RAX: Rs. ${raxRegister.value} (0x${raxRegister.value.toString(16).toUpperCase()})\n[ALU COMPLETED] Final RAX = ₹${raxRegister.value}`;
  }
}

// HexToBCD Converter
const hexInput = ref('0x1A2B');
const bcdConversion = ref({
  decimal: 6699,
  packedBcd: '0x06699',
  unpackedBcd: '0000 0110 0110 1001 1001'
});

function convertHexToBcd() {
  let val = parseInt(hexInput.value.trim(), 16);
  if (isNaN(val)) val = 0;
  const decStr = Math.abs(val).toString(10);
  bcdConversion.value.decimal = val;
  bcdConversion.value.packedBcd = '0x' + decStr.padStart(5, '0');
  bcdConversion.value.unpackedBcd = decStr
    .split('')
    .map(digit => parseInt(digit).toString(2).padStart(4, '0'))
    .join(' ');
}

// Control Unit Simulator
const cuInstructions = [
  { opcode: 'ADD', op1: 10, op2: 5 },
  { opcode: 'SUB', op1: 20, op2: 8 },
  { opcode: 'MUL', op1: 4, op2: 6 }
];
const cuInstIdx = ref(0);
const cuStage = ref('FETCH');
const cuResult = ref(15);

const currentCuInstruction = computed(() => cuInstructions[cuInstIdx.value]);

function advanceCuCycle() {
  if (cuStage.value === 'FETCH') {
    cuStage.value = 'DECODE';
  } else if (cuStage.value === 'DECODE') {
    cuStage.value = 'EXECUTE';
    const ins = currentCuInstruction.value;
    if (ins.opcode === 'ADD') cuResult.value = ins.op1 + ins.op2;
    if (ins.opcode === 'SUB') cuResult.value = ins.op1 - ins.op2;
    if (ins.opcode === 'MUL') cuResult.value = ins.op1 * ins.op2;
  } else {
    cuStage.value = 'FETCH';
    cuInstIdx.value = (cuInstIdx.value + 1) % cuInstructions.length;
  }
}

// -----------------------------------------------------------------------------
// Mapping Table: Airline Fare Operations to Processor Components
// -----------------------------------------------------------------------------
const processorMappingSteps = ref([
  {
    stage: '01',
    operation: 'Base Fare Retrieval',
    asm: 'MOV RAX, [base_fare]',
    primaryComponent: 'Memory Data Register (MDR) & RAX',
    secondaryComponent: 'Memory Address Register (MAR), Bus Interface',
    busActivity: 'Address Bus: Transmits memory address; Data Bus: loads 0x1388 (Rs. 5000); Control: MEM_READ',
    flags: 'None'
  },
  {
    stage: '02',
    operation: 'Aviation Tax Loading',
    asm: 'MOV RBX, 900',
    primaryComponent: 'Base Register (RBX)',
    secondaryComponent: 'Instruction Register (IR), Immediate Latch',
    busActivity: 'Internal CPU Bus: Immediate literal 0x0384 (Rs. 900) gated into RBX',
    flags: 'None'
  },
  {
    stage: '03',
    operation: 'Tax Accumulation (ALU Addition)',
    asm: 'ADD RAX, RBX',
    primaryComponent: 'ALU 64-bit Parallel Adder',
    secondaryComponent: 'Accumulator (RAX), Operand Latches',
    busActivity: 'Datapath: RAX (5000) and RBX (900) summed in ALU; Writeback to RAX: 0x170C (Rs. 5900)',
    flags: 'ZF=0, CF=0, SF=0'
  },
  {
    stage: '04',
    operation: 'Class Multiplier Scaling',
    asm: 'MUL RDX / SHL+ADD',
    primaryComponent: 'ALU Multiplier / Shifter',
    secondaryComponent: 'RDX:RAX Register Pair',
    busActivity: 'Datapath: Multiplier applies 1.0x / 1.8x / 2.5x cabin factor to net fare',
    flags: 'CF/OF if >64b'
  },
  {
    stage: '05',
    operation: 'Baggage Surcharge Comparison',
    asm: 'CMP R8, 15 & JA',
    primaryComponent: 'ALU Comparator & Flags',
    secondaryComponent: 'Program Counter (PC), Control Unit (CU)',
    busActivity: 'ALU subtracts baggage weight (20 - 15); sets CF=0 and branches if weight > 15 kg',
    flags: 'ZF=0, CF=0'
  },
  {
    stage: '06',
    operation: 'Excess Baggage Surcharge Addition',
    asm: 'ADD RAX, R9',
    primaryComponent: 'ALU Parallel Adder',
    secondaryComponent: 'Accumulator (RAX), Register R9',
    busActivity: 'Internal Bus: Excess fee (Rs. 2500) summed into RAX accumulator',
    flags: 'ZF=0, CF=0'
  },
  {
    stage: '07',
    operation: 'Promo Discount Loading',
    asm: 'MOV RCX, 500',
    primaryComponent: 'Counter Register (RCX)',
    secondaryComponent: 'Instruction Decoder, Immediate Buffer',
    busActivity: 'Datapath: Immediate literal 0x01F4 (Rs. 500) loaded into RCX',
    flags: 'None'
  },
  {
    stage: '08',
    operation: 'Discount Deduction (2\'s Comp Subtraction)',
    asm: 'SUB RAX, RCX',
    primaryComponent: 'ALU 2\'s Complement Subtractor',
    secondaryComponent: 'Accumulator (RAX), Flags Register',
    busActivity: 'Datapath: RCX inverted and added to RAX; Final net payable fare committed to RAX',
    flags: 'ZF=0, CF=0, SF=0'
  },
  {
    stage: '09',
    operation: 'Zero/Negative Verification',
    asm: 'TEST RAX, RAX',
    primaryComponent: 'ALU Bitwise AND Logic',
    secondaryComponent: 'Condition Code Flags, Branch Logic',
    busActivity: 'Non-destructive bitwise test to verify net payable fare is strictly positive',
    flags: 'ZF=1 if 0, SF=1 if neg'
  },
  {
    stage: '10',
    operation: 'BCD Decimal Conversion',
    asm: 'Shift & Modulo Division',
    primaryComponent: 'Barrel Shifter & Divider',
    secondaryComponent: 'Shift Counter, BCD Registers',
    busActivity: 'Converts binary fare into 4-bit Packed/Unpacked BCD nibbles for currency display',
    flags: 'ZF, CF per nibble'
  },
  {
    stage: '11',
    operation: 'ABI Calling Convention Return',
    asm: 'RET',
    primaryComponent: 'Stack Pointer (RSP), PC',
    secondaryComponent: 'Call Stack, Memory Bus',
    busActivity: 'Pops caller return address from [RSP] into PC; Net fare in RAX returned to caller',
    flags: 'None'
  }
]);

// -----------------------------------------------------------------------------
// Control-Flow Demo: Seat-Availability Branches & Branch Prediction Simulator
// -----------------------------------------------------------------------------
const branchOccupancySlider = ref(78);
const branchPredictorState = ref('Weakly Taken (10)');

const branchEvaluationTrace = computed(() => {
  const total = 116;
  const occ = branchOccupancySlider.value;
  const booked = Math.round((occ / 100) * total);
  const blocked = 6;
  const avail = Math.max(0, total - (booked + blocked));

  const stages = [];

  // Stage 1: Available <= 0 Check
  const cond1 = avail <= 0;
  stages.push({
    stage: 1,
    asm: 'CMP [available], 0  |  JLE .status_full',
    desc: `Available Seats (${avail}) <= 0`,
    flags: `ZF=${avail <= 0 ? 1 : 0} SF=${avail < 0 ? 1 : 0}`,
    predicted: 'NOT TAKEN',
    actual: cond1 ? 'TAKEN' : 'NOT TAKEN',
    hit: !cond1,
    penalty: cond1 ? 3 : 0,
    action: cond1 ? 'BRANCH TAKEN -> Flight Full (Booking Locked)' : 'FALLTHROUGH -> Evaluate next threshold'
  });

  if (!cond1) {
    // Stage 2: Occupancy >= 90%
    const cond2 = occ >= 90;
    stages.push({
      stage: 2,
      asm: 'CMP [occupancy], 90 |  JGE .status_full',
      desc: `Occupancy (${occ}%) >= 90% Threshold`,
      flags: `ZF=${occ === 90 ? 1 : 0} SF=${occ < 90 ? 1 : 0}`,
      predicted: 'NOT TAKEN',
      actual: cond2 ? 'TAKEN' : 'NOT TAKEN',
      hit: !cond2,
      penalty: cond2 ? 3 : 0,
      action: cond2 ? 'BRANCH TAKEN -> Flight Marked FULL' : 'FALLTHROUGH -> Check Warning Tier'
    });

    if (!cond2) {
      // Stage 3: Occupancy >= 75%
      const cond3 = occ >= 75;
      stages.push({
        stage: 3,
        asm: 'CMP [occupancy], 75 |  JGE .status_low',
        desc: `Occupancy (${occ}%) >= 75% Threshold`,
        flags: `ZF=${occ === 75 ? 1 : 0} SF=${occ < 75 ? 1 : 0}`,
        predicted: 'TAKEN',
        actual: cond3 ? 'TAKEN' : 'NOT TAKEN',
        hit: cond3,
        penalty: cond3 ? 0 : 3,
        action: cond3 ? 'BRANCH TAKEN -> RUNNING LOW (Surge Pricing Multipliers Active)' : 'FALLTHROUGH -> Status OPEN'
      });

      if (!cond3) {
        // Stage 4: Open
        stages.push({
          stage: 4,
          asm: 'MOV [status], 0     |  JMP .done',
          desc: 'Unconditional Jump (Occupancy < 75%)',
          flags: 'None',
          predicted: 'TAKEN',
          actual: 'TAKEN',
          hit: true,
          penalty: 0,
          action: 'STATUS COMMITTED: OPEN (Standard Fares, All Rows Accessible)'
        });
      }
    }
  }

  return {
    total,
    booked,
    blocked,
    avail,
    stages
  };
});


// =============================================================================
// TAB 5: COMPUTER GRAPHICS (CG) IMPLEMENTATION (cpp-cg)
// =============================================================================
const cgTextureEnabled = ref(true);
const cgLightingEnabled = ref(true);
const activeZone = ref('ALL');
const zoomScale = ref(1.0);
const panX = ref(0);
const panY = ref(0);

const zoomZones = [
  { id: 'ALL', name: 'Full Aircraft' },
  { id: 'FIRST', name: 'First Class (Front)' },
  { id: 'BUSINESS', name: 'Business Class (Mid)' },
  { id: 'ECONOMY', name: 'Economy Class (Aft)' }
];

function setZoomZone(zoneId) {
  activeZone.value = zoneId;
  if (zoneId === 'ALL') {
    zoomScale.value = 1.0;
    panX.value = 0;
    panY.value = 0;
  } else if (zoneId === 'FIRST') {
    zoomScale.value = 2.2;
    panX.value = 280;
    panY.value = 0;
  } else if (zoneId === 'BUSINESS') {
    zoomScale.value = 2.0;
    panX.value = 120;
    panY.value = 0;
  } else if (zoneId === 'ECONOMY') {
    zoomScale.value = 1.8;
    panX.value = -240;
    panY.value = 0;
  }
}

// Generate Seat Nodes matching Seats.cpp
const cgSeats = ref([]);
const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

function initializeCgSeats() {
  const seatsList = [];
  const addSeat = (id, label, classType, status, x, y, width, height) => {
    seatsList.push({
      id,
      label,
      classType,
      status,
      selected: false,
      ...aircraftWorldSeatToSvg(x, y, width, height)
    });
  };

  // First Class: 2 rows x 4 cols (2+2)
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 4; c++) {
      const x = 95 + r * 48;
      const ys = [320, 300, 275, 255];
      const y = ys[c];
      const isBooked = (r + c) % 3 === 0;
      addSeat(`F${r+1}${letters[c]}`, `${r+1}${letters[c]}`, 'first',
        isBooked ? 'booked' : 'available', x, y, 20, 12);
    }
  }

  // Business Class: 4 rows x 4 cols (2+2)
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const x = 210 + r * 48;
      const ys = [320, 300, 275, 255];
      const y = ys[c];
      const isBooked = (r * 2 + c) % 4 === 0;
      addSeat(`B${r+1}${letters[c]}`, `${r+1}${letters[c]}`, 'business',
        isBooked ? 'booked' : 'available', x, y, 20, 12);
    }
  }

  // Economy Class: 9 rows x 6 cols (3+3)
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 6; c++) {
      const x = 390 + r * 48;
      const ys = [327, 312, 297, 282, 267, 252];
      const y = ys[c];
      const isBooked = (r + c * 2) % 5 === 0;
      addSeat(`E${r+1}${letters[c]}`, `${r+1}${letters[c]}`, 'economy',
        isBooked ? 'booked' : 'available', x, y, 20, 12);
    }
  }

  // Pilot & Crew
  addSeat('P1', 'PLT', 'pilot', 'pilot', 55, 315, 22, 16);
  addSeat('P2', 'PLT', 'pilot', 'pilot', 55, 270, 22, 16);
  [[350, 320], [350, 255], [825, 320], [825, 255]].forEach(([cx, cy], idx) => {
    addSeat(`CRW${idx+1}`, 'CRW', 'crew', 'crew', cx, cy, 18, 12);
  });

  cgSeats.value = seatsList;
}

function toggleCgSeat(seat) {
  if (seat.status === 'booked' || seat.status === 'pilot' || seat.status === 'crew') return;
  seat.selected = !seat.selected;
}

const selectedCgSeatsCount = computed(() => cgSeats.value.filter(s => s.selected).length);
const availableCgSeatsCount = computed(() => cgSeats.value.filter(s => s.status === 'available' && !s.selected).length);
const bookedCgSeatsCount = computed(() => cgSeats.value.filter(s => s.status === 'booked').length);

// Bresenham Pixels Generator
const bresenhamPixels = computed(() => {
  const points = [];
  let x0 = 60, y0 = 190, x1 = 440, y1 = 55;
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    points.push({ x: x0, y: y0 });
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
  return points;
});

// Cohen-Sutherland Line Clipping Simulation
const clipCoords = ref({ x1: -3, y1: 2, x2: 12, y2: 8 });

function mapClipCoordX(val) {
  // Map domain [-5, 15] to canvas X [60, 440]
  return 60 + ((val + 5) / 20) * 380;
}
function mapClipCoordY(val) {
  // Map domain [-5, 15] to canvas Y [210, 30] (inverted)
  return 210 - ((val + 5) / 20) * 180;
}

const clippedResult = computed(() => {
  const xmin = 0, ymin = 0, xmax = 10, ymax = 10;
  const INSIDE = 0, LEFT = 1, RIGHT = 2, BOTTOM = 4, TOP = 8;

  function getCode(x, y) {
    let code = INSIDE;
    if (x < xmin) code |= LEFT;
    else if (x > xmax) code |= RIGHT;
    if (y < ymin) code |= BOTTOM;
    else if (y > ymax) code |= TOP;
    return code;
  }

  let x1 = clipCoords.value.x1;
  let y1 = clipCoords.value.y1;
  let x2 = clipCoords.value.x2;
  let y2 = clipCoords.value.y2;

  let code1 = getCode(x1, y1);
  let code2 = getCode(x2, y2);
  let accept = false;

  while (true) {
    if ((code1 === 0) && (code2 === 0)) {
      accept = true;
      break;
    } else if (code1 & code2) {
      break;
    } else {
      let codeOut;
      let x = 0, y = 0;
      if (code1 !== 0) codeOut = code1;
      else codeOut = code2;

      if (codeOut & TOP) {
        x = x1 + (x2 - x1) * (ymax - y1) / (y2 - y1);
        y = ymax;
      } else if (codeOut & BOTTOM) {
        x = x1 + (x2 - x1) * (ymin - y1) / (y2 - y1);
        y = ymin;
      } else if (codeOut & RIGHT) {
        y = y1 + (y2 - y1) * (xmax - x1) / (x2 - x1);
        x = xmax;
      } else if (codeOut & LEFT) {
        y = y1 + (y2 - y1) * (xmin - x1) / (x2 - x1);
        x = xmin;
      }

      if (codeOut === code1) {
        x1 = x;
        y1 = y;
        code1 = getCode(x1, y1);
      } else {
        x2 = x;
        y2 = y;
        code2 = getCode(x2, y2);
      }
    }
  }

  return {
    visible: accept,
    cx1: x1,
    cy1: y1,
    cx2: x2,
    cy2: y2,
    message: accept ? 'Partially / Fully Visible (Clipped to Window)' : 'Completely Outside (Rejected)'
  };
});

// =============================================================================
// INTERACTIVE 3D AIRCRAFT MODEL (Aircraft3D.cpp - WebGL / Canvas)
// =============================================================================
const canvas3DRef = ref(null);
const rotX = ref(15);
const rotY = ref(-30);
const rotZ = ref(0);
const zoom3D = ref(1.0);
const autoRotate3D = ref(true);
const active3DProjectionMode = ref('PERSPECTIVE');
const active3DCameraPreset = ref('FREE');
let animationFrameId = null;
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

function reset3DCamera() {
  rotX.value = 15;
  rotY.value = -30;
  rotZ.value = 0;
  zoom3D.value = 1.0;
  active3DCameraPreset.value = 'FREE';
}

function apply3DPreset(preset) {
  active3DCameraPreset.value = preset;
  autoRotate3D.value = false;
  rotZ.value = 0;

  if (preset === 'PLAN') {
    rotX.value = 90;
    rotY.value = 0;
  } else if (preset === 'FRONT') {
    rotX.value = 0;
    rotY.value = 90;
  } else if (preset === 'SIDE') {
    rotX.value = 0;
    rotY.value = 0;
  } else if (preset === 'ISO') {
    rotX.value = 35.264;
    rotY.value = 45;
  } else {
    reset3DCamera();
  }
}

function render3DAircraft() {
  const canvas = canvas3DRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#0a1626');
  bg.addColorStop(1, '#050c17');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // 3D coordinate projection setup
  const cx = w / 2;
  const cy = h / 2;
  const radX = (rotX.value * Math.PI) / 180;
  const radY = (rotY.value * Math.PI) / 180;
  const radZ = (rotZ.value * Math.PI) / 180;
  const scale = 50 * zoom3D.value;

  function project(x, y, z) {
    // Rotation around X (Pitch)
    let y1 = y * Math.cos(radX) - z * Math.sin(radX);
    let z1 = y * Math.sin(radX) + z * Math.cos(radX);

    // Rotation around Y (Yaw)
    let x2 = x * Math.cos(radY) + z1 * Math.sin(radY);
    let z2 = -x * Math.sin(radY) + z1 * Math.cos(radY);

    // Rotation around Z (Roll)
    let x3 = x2 * Math.cos(radZ) - y1 * Math.sin(radZ);
    let y3 = x2 * Math.sin(radZ) + y1 * Math.cos(radZ);

    // Perspective depth
    const fov = 400;
    const distance = 8;
    const depth = distance + z2 * 0.15;
    const pScale = active3DProjectionMode.value === 'ORTHOGRAPHIC'
      ? 1
      : fov / (fov + depth * 30);

    return {
      x: cx + x3 * scale * pScale,
      y: cy - y3 * scale * pScale,
      z: z2
    };
  }

  // Draw 3D Primitives matching Aircraft3D.cpp:
  // 1. Fuselage Cylinder (lines/ribs)
  ctx.strokeStyle = '#54d5e8';
  ctx.lineWidth = 1.8;

  const rings = 8;
  const ringPts = 12;
  const r = 0.7;
  const len = 5.0;

  for (let i = 0; i <= rings; i++) {
    const x = -len / 2 + (i * len) / rings;
    ctx.beginPath();
    for (let j = 0; j <= ringPts; j++) {
      const th = (j * 2 * Math.PI) / ringPts;
      const y = r * Math.cos(th);
      const z = r * Math.sin(th);
      const pt = project(x, y, z);
      if (j === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
  }

  // 2. Nose Sphere / Cone
  ctx.beginPath();
  ctx.strokeStyle = '#75edc1';
  for (let j = 0; j <= ringPts; j++) {
    const th = (j * 2 * Math.PI) / ringPts;
    const pt1 = project(len / 2, r * Math.cos(th), r * Math.sin(th));
    const pt2 = project(len / 2 + 1.2, 0, 0); // Nose tip
    ctx.moveTo(pt1.x, pt1.y);
    ctx.lineTo(pt2.x, pt2.y);
  }
  ctx.stroke();

  // 3. Tail Cone
  ctx.beginPath();
  ctx.strokeStyle = '#38bdf8';
  for (let j = 0; j <= ringPts; j++) {
    const th = (j * 2 * Math.PI) / ringPts;
    const pt1 = project(-len / 2, r * Math.cos(th), r * Math.sin(th));
    const pt2 = project(-len / 2 - 1.2, 0.2 * Math.cos(th), 0.2 * Math.sin(th));
    ctx.moveTo(pt1.x, pt1.y);
    ctx.lineTo(pt2.x, pt2.y);
  }
  ctx.stroke();

  // 4. Main Swept Wings
  ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;

  // Left wing
  const lw1 = project(0.8, 0, 0.6);
  const lw2 = project(-0.8, 0, 3.8);
  const lw3 = project(-1.4, 0, 3.6);
  const lw4 = project(-0.6, 0, 0.6);

  ctx.beginPath();
  ctx.moveTo(lw1.x, lw1.y);
  ctx.lineTo(lw2.x, lw2.y);
  ctx.lineTo(lw3.x, lw3.y);
  ctx.lineTo(lw4.x, lw4.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right wing
  const rw1 = project(0.8, 0, -0.6);
  const rw2 = project(-0.8, 0, -3.8);
  const rw3 = project(-1.4, 0, -3.6);
  const rw4 = project(-0.6, 0, -0.6);

  ctx.beginPath();
  ctx.moveTo(rw1.x, rw1.y);
  ctx.lineTo(rw2.x, rw2.y);
  ctx.lineTo(rw3.x, rw3.y);
  ctx.lineTo(rw4.x, rw4.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 5. Vertical Tail Fin
  const fin1 = project(-len / 2 + 0.2, 0.6, 0);
  const fin2 = project(-len / 2 - 0.9, 1.8, 0);
  const fin3 = project(-len / 2 - 1.4, 1.7, 0);
  const fin4 = project(-len / 2 - 1.0, 0.3, 0);

  ctx.fillStyle = 'rgba(244, 63, 94, 0.3)';
  ctx.strokeStyle = '#f43f5e';
  ctx.beginPath();
  ctx.moveTo(fin1.x, fin1.y);
  ctx.lineTo(fin2.x, fin2.y);
  ctx.lineTo(fin3.x, fin3.y);
  ctx.lineTo(fin4.x, fin4.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 6. Horizontal Stabilizers
  ctx.strokeStyle = '#a78bfa';
  const hsL1 = project(-len / 2 - 0.4, 0, 0.2);
  const hsL2 = project(-len / 2 - 1.3, 0, 1.4);
  const hsR1 = project(-len / 2 - 0.4, 0, -0.2);
  const hsR2 = project(-len / 2 - 1.3, 0, -1.4);

  ctx.beginPath();
  ctx.moveTo(hsL1.x, hsL1.y);
  ctx.lineTo(hsL2.x, hsL2.y);
  ctx.moveTo(hsR1.x, hsR1.y);
  ctx.lineTo(hsR2.x, hsR2.y);
  ctx.stroke();

  // Auto rotation update
  if (autoRotate3D.value) {
    rotY.value = (rotY.value + 0.6) % 360;
  }

  animationFrameId = requestAnimationFrame(render3DAircraft);
}

// Canvas Mouse Drag Interaction
function handleMouseDown(e) {
  isDragging = true;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
}

function handleMouseMove(e) {
  if (!isDragging) return;
  const deltaX = e.clientX - lastMouseX;
  const deltaY = e.clientY - lastMouseY;
  rotY.value = (rotY.value + deltaX * 0.6) % 360;
  rotX.value = Math.max(-85, Math.min(85, rotX.value - deltaY * 0.6));
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
}

function handleMouseUp() {
  isDragging = false;
}

// =============================================================================
// LIFECYCLE HOOKS
// =============================================================================
onMounted(async () => {
  await Promise.all([
    loadFlights(),
    authStore.isAdmin ? loadAdminOperations() : Promise.resolve(),
    loadNativeDemo()
  ]);
  initializeCgSeats();

  nextTick(() => {
    const canvas = canvas3DRef.value;
    if (canvas) {
      canvas.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      render3DAircraft();
    }
  });
});

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleMouseUp);
});
</script>

<style scoped>
/* Base Theme & Layout */
.project-dashboard {
  min-height: 100vh;
  background-color: #0b1523;
  color: #e2e8f0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  padding-bottom: 80px;
}

.flight-select-label,
.admin-search-row {
  display: grid;
  gap: 8px;
  color: #cbd5e1;
  font-size: 0.85rem;
  font-weight: 700;
}

.flight-select-label {
  min-width: min(320px, 100%);
}

.api-seat-stats {
  margin: 18px 0;
}

.auth-notice {
  padding: 16px;
  border: 1px solid rgba(245, 158, 11, 0.35);
  border-radius: 10px;
  background: rgba(245, 158, 11, 0.08);
  color: #fde68a;
}

.auth-notice a,
.operational-links a {
  color: #7dd3fc;
  font-weight: 700;
}

.admin-search-row {
  margin: 20px 0 12px;
  max-width: 520px;
}

.native-output-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
  gap: 16px;
}

.native-output-card {
  min-width: 0;
  padding: 16px;
  border: 1px solid #24415f;
  border-radius: 10px;
  background: rgba(8, 20, 34, 0.7);
  overflow: auto;
}

.native-output-card h4 {
  margin: 0 0 12px;
  color: #e0f2fe;
}

.native-seat-map {
  display: grid;
  gap: 5px;
}

.native-seat-row {
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  gap: 5px;
}

.native-seat-cell {
  display: grid;
  place-items: center;
  min-width: 24px;
  height: 24px;
  border-radius: 4px;
  background: #1e3a5f;
  color: #bae6fd;
  font: 0.7rem ui-monospace, monospace;
}

.native-record-list {
  display: grid;
  gap: 6px;
  margin: 12px 0 0;
  padding-left: 18px;
}

.native-sort-output {
  max-width: 100%;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.operational-links {
  margin-top: 16px;
}

.container {
  max-width: 1360px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Hero Section */
.dashboard-hero {
  background: radial-gradient(circle at 80% 20%, rgba(56, 189, 248, 0.12), transparent 50%),
              linear-gradient(135deg, #07101c 0%, #0d2238 60%, #091728 100%);
  border-bottom: 1px solid #1e3a5f;
  padding: 42px 0 32px;
}

.hero-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 32px;
  flex-wrap: wrap;
}

.hero-left {
  max-width: 800px;
}

.hero-tag-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.eyebrow-tag {
  color: #38bdf8;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  background: rgba(56, 189, 248, 0.1);
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(56, 189, 248, 0.25);
}

.api-live-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #f87171;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 999px;
  padding: 4px 10px;
}

.api-live-tag.connected {
  color: #34d399;
  background: rgba(16, 185, 129, 0.12);
  border-color: rgba(16, 185, 129, 0.3);
}

.pulsing-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: currentColor;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}

.hero-title {
  font-size: clamp(26px, 3.2vw, 42px);
  color: #ffffff;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.15;
  margin: 0 0 12px;
}

.hero-desc {
  font-size: 15px;
  line-height: 1.6;
  color: #94a3b8;
  margin: 0;
}

.hero-desc strong {
  color: #e2e8f0;
}

.hero-quick-stats {
  display: flex;
  gap: 14px;
}

.stat-pill {
  background: rgba(15, 31, 51, 0.7);
  border: 1px solid #1e3a5f;
  border-radius: 12px;
  padding: 14px 18px;
  min-width: 120px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.stat-number {
  display: block;
  font-size: 24px;
  font-weight: 800;
  color: #38bdf8;
}

.stat-number.status-green { color: #34d399; }
.stat-number.status-amber { color: #fbbf24; }
.stat-number.status-red { color: #f87171; }

.stat-label {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
}

/* Master Tabs Navigation */
.tab-nav-wrapper {
  background: #091321;
  border-bottom: 1px solid #1a2f47;
  position: sticky;
  top: 0;
  z-index: 100;
}

.master-tabs {
  display: flex;
  gap: 8px;
  padding: 10px 0;
  overflow-x: auto;
}

.master-tab-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 10px 16px;
  cursor: pointer;
  color: #94a3b8;
  text-align: left;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.master-tab-btn:hover {
  background: rgba(255, 255, 255, 0.04);
  color: #e2e8f0;
}

.master-tab-btn.active {
  background: #142842;
  border-color: #38bdf8;
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(56, 189, 248, 0.15);
}

.tab-badge-icon {
  font-size: 16px;
  margin-bottom: 3px;
}

.tab-title-text {
  font-size: 13px;
  font-weight: 700;
}

.tab-sub-text {
  font-size: 10px;
  color: #64748b;
  margin-top: 2px;
}

.master-tab-btn.active .tab-sub-text {
  color: #7dd3fc;
}

/* Dashboard Body & Panels */
.dashboard-body {
  padding-top: 32px;
}

.tab-section {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.section-intro {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.section-intro h2 {
  font-size: 22px;
  font-weight: 800;
  margin: 0 0 6px;
  color: #ffffff;
}

.subtitle {
  color: #94a3b8;
  font-size: 13px;
  margin: 0;
}

.content-panel {
  background: #0f1f33;
  border: 1px solid #1e3a5f;
  border-radius: 14px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
  gap: 16px;
  flex-wrap: wrap;
}

.panel-header h3 {
  font-size: 17px;
  font-weight: 700;
  margin: 0 0 4px;
  color: #ffffff;
}

.panel-hint {
  font-size: 12px;
  color: #8da4be;
  margin: 0;
}

.badge-source {
  font-family: monospace;
  font-size: 11px;
  color: #38bdf8;
  background: #082138;
  border: 1px solid #1e3a5f;
  padding: 4px 8px;
  border-radius: 6px;
}

.badge-algo {
  font-family: monospace;
  font-size: 11px;
  color: #34d399;
  background: #072a1e;
  border: 1px solid #0f5132;
  padding: 2px 7px;
  border-radius: 4px;
  margin-left: 6px;
}

/* Metric Cards */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #0d1c2e;
  border: 1px solid #1a334f;
  border-radius: 12px;
  padding: 16px;
}

.metric-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 20px;
}

.metric-icon.blue { background: #0369a133; color: #38bdf8; }
.metric-icon.green { background: #04785733; color: #34d399; }
.metric-icon.violet { background: #6d28d933; color: #a78bfa; }
.metric-icon.gold { background: #b4530933; color: #fbbf24; }

.metric-info {
  display: flex;
  flex-direction: column;
}

.metric-label {
  font-size: 11px;
  color: #94a3b8;
}

.metric-value {
  font-size: 16px;
  font-weight: 800;
  color: #ffffff;
  margin: 3px 0;
}

.metric-sub {
  font-size: 11px;
  color: #64748b;
}

/* Two-Column Layout */
.two-col-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(480px, 1fr));
  gap: 20px;
}

/* Forms & Inputs */
.form-row {
  display: flex;
  gap: 14px;
  margin-bottom: 12px;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-input {
  background: #091422;
  border: 1px solid #233e5c;
  color: #e2e8f0;
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: #38bdf8;
}

.form-input.sm {
  padding: 6px 10px;
  font-size: 12px;
}

.form-input.narrow {
  max-width: 90px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid transparent;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-primary {
  background: #0284c7;
  color: #ffffff;
}

.btn-primary:hover {
  background: #0369a1;
}

.btn-outline {
  background: transparent;
  border-color: #2b4969;
  color: #94a3b8;
}

.btn-outline:hover {
  border-color: #38bdf8;
  color: #ffffff;
}

.btn-danger {
  background: #dc2626;
  color: #ffffff;
}

.btn-warning {
  background: #d97706;
  color: #ffffff;
}

.btn-block {
  width: 100%;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.btn-xs {
  padding: 3px 8px;
  font-size: 10px;
}

/* Tables */
.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
}

.data-table th {
  background: #0a1727;
  color: #94a3b8;
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 10px 14px;
  border-bottom: 1px solid #1a334f;
}

.data-table td {
  padding: 11px 14px;
  border-bottom: 1px solid #162a42;
  color: #cbd5e1;
}

.data-table tr:hover td {
  background: rgba(255, 255, 255, 0.02);
}

.code-font {
  font-family: Consolas, monospace;
}

.flight-tag {
  background: #0c2d48;
  color: #38bdf8;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 11px;
}

.pnr-badge {
  color: #fbbf24;
  letter-spacing: 1px;
}

.seat-badge {
  background: #1e293b;
  color: #cbd5e1;
  padding: 3px 7px;
  border-radius: 4px;
  font-size: 11px;
}

.status-chip {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.status-chip.green { background: #064e3b; color: #34d399; }
.status-chip.amber { background: #78350f; color: #fbbf24; }
.status-chip.red { background: #7f1d1d; color: #f87171; }
.status-chip.blue { background: #0c4a6e; color: #38bdf8; }
.status-chip.violet { background: #4c1d95; color: #c084fc; }

.class-chip {
  padding: 3px 7px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
}

.class-chip.firstclass, .class-chip.first { background: #3b0764; color: #d8b4fe; }
.class-chip.business { background: #1e1b4b; color: #818cf8; }
.class-chip.economy { background: #064e3b; color: #6ee7b7; }

/* PNR Generator Box */
.pnr-display-area {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #081524;
  border: 1px dashed #24486d;
  border-radius: 10px;
  padding: 14px 18px;
  margin-bottom: 16px;
}

.pnr-title {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 700;
}

.pnr-highlight {
  font-family: Consolas, monospace;
  font-size: 22px;
  font-weight: 800;
  color: #fbbf24;
  letter-spacing: 3px;
}

/* Method Overloading Results */
.overload-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 14px;
}

.overload-res-card {
  background: #081524;
  border: 1px solid #1a3552;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
}

.overload-res-card.highlight {
  border-color: #34d399;
  background: #05231c;
}

.code-method {
  font-family: monospace;
  font-size: 10px;
  color: #38bdf8;
  margin-bottom: 4px;
}

.overload-res-card strong {
  font-size: 16px;
  color: #ffffff;
}

.overload-res-card small {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 2px;
}

.text-green { color: #34d399 !important; }
.text-cyan { color: #38bdf8 !important; }
.text-muted { color: #64748b !important; }

/* Swing Window Mockup */
.swing-window-mockup {
  border: 1px solid #334155;
  border-radius: 8px;
  background: #1e293b;
  overflow: hidden;
}

.swing-title-bar {
  background: #334155;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
}

.swing-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.swing-dot.red { background: #ef4444; }
.swing-dot.yellow { background: #f59e0b; }
.swing-dot.green { background: #10b981; }

.swing-title {
  margin-left: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #f1f5f9;
}

.swing-body {
  padding: 14px;
  background: #0f172a;
}

.swing-field {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 10px;
}

.swing-field label {
  width: 90px;
  font-size: 12px;
  color: #94a3b8;
}

.swing-input {
  flex: 1;
  background: #1e293b;
  border: 1px solid #475569;
  color: #f8fafc;
  padding: 5px 8px;
  font-size: 12px;
  border-radius: 4px;
}

.swing-buttons {
  display: flex;
  gap: 8px;
  margin: 10px 0;
}

.swing-btn {
  background: #334155;
  color: #f8fafc;
  padding: 5px 10px;
  font-size: 11px;
}

.swing-btn:hover {
  background: #475569;
}

.swing-textarea {
  background: #020617;
  border: 1px solid #1e293b;
  border-radius: 4px;
  padding: 8px;
  height: 120px;
  overflow-y: auto;
}

.swing-textarea pre {
  margin: 0;
  font-family: Consolas, monospace;
  font-size: 11px;
  color: #38bdf8;
  line-height: 1.4;
}

/* CSV Viewer */
.csv-viewer {
  border: 1px solid #1e3a5f;
  border-radius: 8px;
  background: #08121f;
  overflow: hidden;
}

.csv-header-bar {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #0e2035;
  font-family: monospace;
  font-size: 11px;
  color: #94a3b8;
  border-bottom: 1px solid #1e3a5f;
}

.csv-content {
  margin: 0;
  padding: 12px;
  font-family: Consolas, monospace;
  font-size: 11px;
  color: #7dd3fc;
  max-height: 240px;
  overflow-y: auto;
  line-height: 1.6;
}

/* Data Structures Lab (Tab 3) */
.circular-queue-visual {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ring-slots {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.queue-slot {
  border: 1px solid #233e5c;
  border-radius: 8px;
  background: #091524;
  padding: 10px 8px;
  text-align: center;
  position: relative;
  min-height: 70px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.queue-slot.occupied {
  border-color: #38bdf8;
  background: #0c2742;
}

.queue-slot.isFront {
  box-shadow: 0 0 0 2px #34d399;
}

.queue-slot.isRear {
  box-shadow: 0 0 0 2px #38bdf8;
}

.slot-idx {
  position: absolute;
  top: 4px;
  left: 6px;
  font-size: 9px;
  color: #64748b;
  font-family: monospace;
}

.slot-val {
  font-size: 12px;
  color: #ffffff;
}

.slot-val small {
  color: #38bdf8;
}

.slot-empty {
  font-size: 11px;
  color: #475569;
}

.slot-labels {
  position: absolute;
  bottom: -6px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 4px;
}

.ptr-tag {
  font-size: 8px;
  font-weight: 800;
  padding: 1px 4px;
  border-radius: 3px;
}

.front-tag { background: #34d399; color: #022c22; }
.rear-tag { background: #38bdf8; color: #082f49; }

.queue-status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #081422;
  border: 1px solid #1a334f;
  border-radius: 6px;
  font-size: 12px;
}

.queue-badge {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
}

.queue-badge.green { background: #064e3b; color: #34d399; }
.queue-badge.red { background: #7f1d1d; color: #f87171; }

.queue-controls {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.input-inline {
  display: flex;
  gap: 8px;
  flex: 1;
}

/* Priority Deque */
.deque-mode-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  font-size: 12px;
}

.radio-pill-group {
  display: flex;
  gap: 4px;
}

.btn-pill {
  background: #091524;
  border: 1px solid #233e5c;
  color: #94a3b8;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
}

.btn-pill.active {
  background: #0284c7;
  color: #ffffff;
  border-color: #38bdf8;
}

.deque-display {
  background: #081321;
  border: 1px solid #1a334f;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
}

.deque-end-label {
  font-size: 10px;
  font-weight: 800;
  color: #64748b;
  writing-mode: vertical-rl;
  text-orientation: mixed;
}

.deque-items-row {
  display: flex;
  gap: 8px;
  flex: 1;
}

.deque-item {
  border: 1px solid #233e5c;
  border-radius: 8px;
  padding: 8px 10px;
  min-width: 110px;
  display: flex;
  flex-direction: column;
}

.deque-item.elderly { border-color: #34d399; background: #05291f; }
.deque-item.vip { border-color: #fbbf24; background: #291e05; }
.deque-item.normal { border-color: #38bdf8; background: #08233a; }

.category-badge {
  font-size: 9px;
  font-weight: 800;
  margin-bottom: 2px;
}

.deque-item.elderly .category-badge { color: #34d399; }
.deque-item.vip .category-badge { color: #fbbf24; }
.deque-item.normal .category-badge { color: #38bdf8; }

.deque-btn-row {
  display: flex;
  gap: 6px;
  margin-top: 10px;
}

/* Undo Stack */
.stack-layout {
  display: grid;
  grid-template-columns: 1fr 180px;
  gap: 16px;
}

.seats-30-container {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  margin-top: 8px;
}

.mini-seat-btn {
  aspect-ratio: 1;
  background: #091626;
  border: 1px solid #233e5c;
  color: #94a3b8;
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
}

.mini-seat-btn.selected {
  background: #fbbf24;
  color: #0f172a;
  border-color: #fde68a;
}

.stack-tube {
  border: 2px dashed #233e5c;
  border-top: none;
  border-radius: 0 0 8px 8px;
  min-height: 160px;
  max-height: 160px;
  overflow-y: auto;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stack-item-card {
  background: #11243b;
  border: 1px solid #2a486d;
  border-radius: 4px;
  padding: 4px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
}

.stack-action-type {
  font-size: 9px;
  font-weight: 800;
  padding: 1px 4px;
  border-radius: 2px;
}

.stack-action-type.S { background: #34d399; color: #022c22; }
.stack-action-type.C { background: #f87171; color: #450a0a; }

/* Manifest Merge DLL */
.manifest-split-view {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.manifest-column {
  background: #081321;
  border: 1px solid #1a334f;
  border-radius: 8px;
  padding: 10px;
}

.manifest-tag {
  font-size: 11px;
  font-weight: 800;
  color: #38bdf8;
  display: block;
  margin-bottom: 8px;
}

.dll-nodes {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dll-node-card {
  display: flex;
  justify-content: space-between;
  padding: 6px 10px;
  background: #0e2238;
  border: 1px solid #203c5d;
  border-radius: 4px;
  font-size: 12px;
}

.seat-tag {
  color: #fbbf24;
  font-weight: 800;
}

.merged-nodes-chain {
  display: flex;
  align-items: center;
  gap: 4px;
  overflow-x: auto;
  padding: 10px 0;
}

.chain-node {
  display: flex;
  align-items: center;
  gap: 4px;
}

.chain-content {
  border: 1px solid #34d399;
  background: #05261d;
  border-radius: 6px;
  padding: 6px 10px;
  text-align: center;
}

.node-arrow {
  color: #64748b;
  font-weight: 800;
}

/* COA Architecture Tab (Tab 4) */
.status-indicator-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 10px;
  padding: 16px 20px;
  margin-bottom: 16px;
}

.status-indicator-hero.status-green {
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-indicator-hero.status-amber {
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.status-indicator-hero.status-red {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.status-led {
  width: 14px;
  height: 14px;
  border-radius: 50%;
}

.status-led.status-green { background: #10b981; box-shadow: 0 0 10px #10b981; }
.status-led.status-amber { background: #f59e0b; box-shadow: 0 0 10px #f59e0b; }
.status-led.status-red { background: #ef4444; box-shadow: 0 0 10px #ef4444; }

.status-hero-label {
  font-size: 11px;
  color: #94a3b8;
  display: block;
}

.status-hero-val {
  font-size: 20px;
  font-weight: 800;
  color: #ffffff;
}

.occupancy-large-percent {
  font-size: 32px;
  font-weight: 900;
  font-family: monospace;
}

.occupancy-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 14px;
}

.stat-box {
  background: #081321;
  border: 1px solid #1a334f;
  border-radius: 8px;
  padding: 10px;
  text-align: center;
}

.stat-box small {
  display: block;
  font-size: 9px;
  color: #94a3b8;
  margin-bottom: 2px;
}

.stat-box strong {
  font-size: 18px;
  color: #ffffff;
}

.stat-box.green strong { color: #34d399; }
.stat-box.red strong { color: #f87171; }
.stat-box.amber strong { color: #fbbf24; }

.occupancy-slider-row {
  margin: 14px 0;
}

.occupancy-slider-row label {
  font-size: 12px;
  color: #94a3b8;
  display: block;
  margin-bottom: 6px;
}

.occupancy-range {
  width: 100%;
}

.binary-register-box {
  background: #040c17;
  border: 1px solid #162a42;
  border-radius: 6px;
  padding: 10px 12px;
}

.reg-label {
  font-size: 10px;
  font-weight: 800;
  color: #64748b;
  display: block;
  margin-bottom: 4px;
}

.binary-string {
  font-size: 15px;
  color: #38bdf8;
  letter-spacing: 2px;
}

/* 64-bit Registers */
.registers-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}

.register-card {
  background: #081422;
  border: 1px solid #1b334e;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
}

.register-card.active {
  border-color: #38bdf8;
  background: #0b243d;
}

.reg-name {
  font-size: 11px;
  font-weight: 800;
  color: #94a3b8;
}

.reg-value {
  font-size: 13px;
  color: #38bdf8;
  margin: 2px 0;
}

.reg-dec {
  font-size: 14px;
  font-weight: 800;
  color: #ffffff;
}

.flags-register-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.flags-title {
  font-size: 11px;
  font-weight: 800;
  color: #94a3b8;
}

.flags-pills {
  display: flex;
  gap: 6px;
}

.flag-chip {
  font-family: monospace;
  font-size: 10px;
  padding: 3px 6px;
  border-radius: 4px;
  background: #111e2f;
  color: #64748b;
  border: 1px solid #1e3a5f;
}

.flag-chip.set {
  background: #064e3b;
  color: #34d399;
  border-color: #10b981;
}

.alu-stepper-console {
  background: #050d18;
  border: 1px solid #1a334f;
  border-radius: 8px;
  padding: 10px;
}

.stepper-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.asm-terminal-log {
  margin: 0;
  font-family: Consolas, monospace;
  font-size: 11px;
  color: #38bdf8;
  line-height: 1.5;
  max-height: 140px;
  overflow-y: auto;
}

/* BCD Box */
.bcd-results-box {
  background: #06111f;
  border: 1px solid #1a334f;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bcd-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

/* Control Unit Stages */
.cu-stages-chain {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.cu-stage {
  background: #081321;
  border: 1px solid #1a334f;
  border-radius: 8px;
  padding: 10px;
  text-align: center;
}

.cu-stage.active {
  border-color: #38bdf8;
  background: #0b243d;
}

.stage-tag {
  font-size: 9px;
  color: #64748b;
  display: block;
}

.cu-stage strong {
  display: block;
  font-size: 13px;
  color: #ffffff;
  margin: 2px 0;
}

.cu-stage small {
  font-size: 10px;
  color: #38bdf8;
}

/* Computer Graphics (Tab 5) */
.canvas-3d-wrapper {
  background: #050c17;
  border: 1px solid #1a334f;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.canvas-3d {
  display: block;
  width: 100%;
  height: 380px;
  cursor: grab;
}

.canvas-3d:active {
  cursor: grabbing;
}

.canvas-3d-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  background: #081321;
  border-top: 1px solid #1a334f;
  font-size: 12px;
  color: #94a3b8;
}

.axis-buttons {
  display: flex;
  gap: 6px;
}

.zoom-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.toolbar-label {
  font-size: 12px;
  color: #94a3b8;
}

.btn-zone {
  background: #091524;
  border: 1px solid #233e5c;
  color: #cbd5e1;
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 11px;
  cursor: pointer;
}

.btn-zone.active {
  background: #0284c7;
  border-color: #38bdf8;
  color: #ffffff;
}

.plane-frame-container {
  overflow: hidden;
  border: 1px solid #1a334f;
  border-radius: 10px;
  background: radial-gradient(circle at 50% 50%, #0d2138 0%, #06111f 80%);
}

.plane-svg-canvas {
  display: block;
  width: 100%;
  height: auto;
  transition: transform 0.4s ease-out;
}

.cg-label {
  fill: #94a3b8;
  font-size: 11px;
  font-weight: 700;
}

.cg-zone-label {
  fill: #cbd5e1;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 2px;
}

.svg-seat-node rect {
  cursor: pointer;
  stroke: #12283a;
  stroke-width: 1.5;
}

.svg-seat-node text {
  fill: #ffffff;
  pointer-events: none;
}

.svg-seat-node.first rect { fill: #7c3aed; stroke: #f5c530; stroke-width: 1.5; }
.svg-seat-node.business rect { fill: #2563eb; }
.svg-seat-node.economy rect { fill: #059669; }
.svg-seat-node.selected rect { fill: #fbbf24; stroke: #fff; stroke-width: 2; }
.svg-seat-node.booked rect { fill: #dc2626; cursor: not-allowed; }
.svg-seat-node.blocked rect { fill: #4b5563; cursor: not-allowed; }
.svg-seat-node.pilot rect { fill: #1e40af; cursor: default; }
.svg-seat-node.crew rect { fill: #ea580c; cursor: default; }

.cg-legend {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 14px;
  font-size: 11px;
  color: #94a3b8;
}

.legend-stats {
  margin-left: auto;
  color: #ffffff;
}

.swatch {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  display: inline-block;
  vertical-align: middle;
}

.swatch.plum { background: #7c3aed; border: 1px solid #f5c530; }
.swatch.sapphire { background: #2563eb; }
.swatch.emerald { background: #059669; }
.swatch.amber { background: #fbbf24; }
.swatch.crimson { background: #dc2626; }
.swatch.slate { background: #4b5563; }
.swatch.navy { background: #1e40af; }
.swatch.orange { background: #ea580c; }

/* Bresenham & Clipping SVG */
.algo-canvas-box {
  background: #06111f;
  border: 1px solid #1a334f;
  border-radius: 8px;
  padding: 12px;
}

.algo-svg {
  display: block;
  width: 100%;
  height: 190px;
}

.algo-status-bar {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 11px;
  color: #94a3b8;
}

.clipping-inputs-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.clip-inp {
  display: flex;
  align-items: center;
  gap: 4px;
}

.clip-inp label {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
}

.route-line {
  animation: flyRoute 3s linear infinite;
}

@keyframes flyRoute {
  to {
    stroke-dashoffset: -32;
  }
}

/* System Topology */
.topology-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.topo-card {
  background: #091524;
  border: 1px solid #1e3a5f;
  border-radius: 10px;
  padding: 16px;
}

.topo-icon {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-size: 18px;
  margin-bottom: 10px;
}

.topo-card h4 {
  font-size: 15px;
  margin: 0 0 2px;
  color: #ffffff;
}

.topo-code {
  font-size: 10px;
  font-weight: 800;
  color: #38bdf8;
  display: block;
  margin-bottom: 8px;
}

.topo-card p {
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.5;
  margin: 0 0 10px;
}

.topo-files {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.topo-files code {
  font-size: 10px;
  color: #7dd3fc;
  background: #040c17;
  padding: 3px 6px;
  border-radius: 4px;
  border: 1px solid #162a42;
  overflow-wrap: anywhere;
}

/* ========================================================================= */
/* Generic Repository Demo Styles                                            */
/* ========================================================================= */
.repo-demo-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 14px;
}

.repo-actions-box {
  background: #06111f;
  border: 1px solid #1a334f;
  border-radius: 8px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.repo-actions-box label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #38bdf8;
  letter-spacing: 0.5px;
}

.repo-buttons-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.repo-interactive-form {
  margin-top: 4px;
}

.repo-console-output {
  background: #040913;
  border: 1px solid #14283f;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.repo-log {
  margin: 6px 0 0;
  padding: 8px;
  background: #02050b;
  border-radius: 6px;
  border: 1px solid #0f1f31;
  color: #38bdf8;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 11px;
  line-height: 1.5;
  height: 140px;
  overflow-y: auto;
  white-space: pre-wrap;
}

/* ========================================================================= */
/* PNR Hash Table Separate Chaining Visualizer                               */
/* ========================================================================= */
.hash-table-visualizer {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 14px;
}

.hash-buckets-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #06111f;
  border: 1px solid #1a334f;
  border-radius: 8px;
  padding: 14px;
}

.hash-bucket-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 8px;
  background: #081628;
  border: 1px solid #162a42;
  border-radius: 6px;
  overflow-x: auto;
}

.bucket-idx-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  color: #38bdf8;
  background: #0c1e33;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #1e3a5f;
  min-width: 82px;
  text-align: center;
  flex-shrink: 0;
}

.bucket-chain {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.empty-bucket-tag {
  font-size: 11px;
  color: #475569;
  font-style: italic;
}

.hash-chain-node {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chain-arrow {
  color: #38bdf8;
  font-weight: bold;
  font-size: 13px;
}

.hash-node-box {
  background: #0f2744;
  border: 1px solid #2563eb;
  border-radius: 6px;
  padding: 4px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
}

.hash-node-box strong {
  color: #f8fafc;
  font-family: 'JetBrains Mono', monospace;
}

.hash-node-box small {
  color: #94a3b8;
  font-size: 10px;
}

.hash-node-box.collision {
  border-color: #f59e0b;
  background: #231c0a;
}

.hash-node-box.collision strong {
  color: #fbbf24;
}

.chain-null {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  color: #ef4444;
  background: #2a1010;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid #4a1818;
}

.hash-search-panel {
  background: #081628;
  border: 1px solid #1a334f;
  border-radius: 8px;
  padding: 12px;
}

/* ========================================================================= */
/* Mapping Table & Data Formatting                                           */
/* ========================================================================= */
.mapping-table th {
  background: #07172b;
  color: #38bdf8;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 10px 12px;
}

.mapping-table td {
  padding: 9px 12px;
  font-size: 12px;
  border-bottom: 1px solid #14283f;
  vertical-align: middle;
}

.mapping-table tr:hover {
  background: rgba(56, 189, 248, 0.04);
}

.bold-text {
  font-weight: 700;
  color: #38bdf8;
  font-family: 'JetBrains Mono', monospace;
}

.code-font {
  font-family: 'JetBrains Mono', monospace;
}

.text-cyan {
  color: #38bdf8;
}

/* Responsive Media Queries */
@media (max-width: 900px) {
  .two-col-layout {
    grid-template-columns: 1fr;
  }
  .stack-layout {
    grid-template-columns: 1fr;
  }
  .repo-demo-grid {
    grid-template-columns: 1fr;
  }
  .hero-quick-stats {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
