package com.baseballmate.api.companion;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "companion_posts")
public class CompanionPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String authorId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String stadium;

    @Column(nullable = false)
    private LocalDate gameDate;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(nullable = false)
    private String authorName;

    @Column(nullable = false)
    private String authorPreferredTeam;

    @Column(nullable = false)
    private int totalTickets;

    @Column(nullable = false)
    private int wantedCount;

    private String ticketImageUrl;

    @Column(nullable = false)
    private boolean isClosed = false;

    // 좌석 위치 정보 (선택)
    private String seatZone;    // 구역 (ex: 1루 응원석)
    private String seatBlock;   // 블록 (ex: 304)
    private String seatRow;     // 열   (ex: 12)
    private String seatNumber;  // 좌석번호 (ex: 45)

    protected CompanionPost() {}

    public CompanionPost(String authorId, String title, String stadium, LocalDate gameDate,
                         String description, String authorName, String authorPreferredTeam,
                         int totalTickets, int wantedCount, String ticketImageUrl,
                         String seatZone, String seatBlock, String seatRow, String seatNumber) {
        this.authorId = authorId;
        this.title = title;
        this.stadium = stadium;
        this.gameDate = gameDate;
        this.description = description;
        this.authorName = authorName;
        this.authorPreferredTeam = authorPreferredTeam;
        this.totalTickets = totalTickets;
        this.wantedCount = wantedCount;
        this.ticketImageUrl = ticketImageUrl;
        this.seatZone = seatZone;
        this.seatBlock = seatBlock;
        this.seatRow = seatRow;
        this.seatNumber = seatNumber;
    }

    public Long getId()                    { return id; }
    public String getAuthorId()            { return authorId; }
    public String getTitle()               { return title; }
    public String getStadium()             { return stadium; }
    public LocalDate getGameDate()         { return gameDate; }
    public String getDescription()         { return description; }
    public String getAuthorName()          { return authorName; }
    public String getAuthorPreferredTeam() { return authorPreferredTeam; }
    public int getTotalTickets()           { return totalTickets; }
    public int getWantedCount()            { return wantedCount; }
    public String getTicketImageUrl()      { return ticketImageUrl; }
    public boolean isClosed()              { return isClosed; }
    public String getSeatZone()            { return seatZone; }
    public String getSeatBlock()           { return seatBlock; }
    public String getSeatRow()             { return seatRow; }
    public String getSeatNumber()          { return seatNumber; }

    public void toggleClosed() { this.isClosed = !this.isClosed; }

    public void update(String title, String stadium, LocalDate gameDate, String description,
                       int totalTickets, int wantedCount, String ticketImageUrl,
                       String seatZone, String seatBlock, String seatRow, String seatNumber) {
        this.title = title;
        this.stadium = stadium;
        this.gameDate = gameDate;
        this.description = description;
        this.totalTickets = totalTickets;
        this.wantedCount = wantedCount;
        if (ticketImageUrl != null) this.ticketImageUrl = ticketImageUrl;
        this.seatZone = seatZone;
        this.seatBlock = seatBlock;
        this.seatRow = seatRow;
        this.seatNumber = seatNumber;
    }
}
