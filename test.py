import psycopg2

# Database connection parameters
db_params = {
    "dbname": "mydatabase",
    "user": "postgres",
    "password": "password",
    "host": "138.197.82.78",
    "port": 6543
}

game_id = "26da88fc-0a85-4524-abe2-a3f2d77fa16c"

try:
    conn = psycopg2.connect(**db_params)
    cur = conn.cursor()

    # Fetch the bytea data
    cur.execute("SELECT data FROM game_data WHERE game_id = %s", (game_id,))
    row = cur.fetchone()

    if row:
        with open("game_data.bin", "wb") as f:
            f.write(row[0])
        print("File saved as game_data.bin")
    else:
        print("No data found for the given game_id.")

    cur.close()
    conn.close()
except Exception as e:
    print("Error:", e)
